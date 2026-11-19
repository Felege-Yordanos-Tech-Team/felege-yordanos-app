import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  accessLevel,
  canCloseEvent,
  canManagePreMembers,
  canSeeAudience,
  canViewEvent,
  canViewNotices,
  hasMemberAccess,
  hasPreMemberAccess,
  canReopenEvent,
  canViewEventSummary,
  canViewPeople,
  canViewPersonAttendance,
  closableFrom,
  canSendMessages,
  canGrantMessaging,
  canReceiveMessagingGrant,
  canViewBroadcast,
  canCancelBroadcast,
  canEditBroadcast,
  canSetEventReminder,
  canChangeSmsOptOut,
} from './permissions';

// Department 2 event, Sunday 15:30 EAT, check-in 15:10–15:50.
const event = {
  departmentId: 2,
  eventDate: '2026-10-11',
  startTime: '15:30:00',
  checkInOpensBeforeMin: 20,
  checkInClosesAfterMin: 20,
};
const at = (hhmm: string) => new Date(`2026-10-11T${hhmm}+03:00`);

const head = { id: 'h', role: 'dept_head' as const, departmentId: 2 };
const otherHead = { id: 'o', role: 'dept_head' as const, departmentId: 6 };
const programsHead = { id: 'p', role: 'dept_head' as const, departmentId: 3 };
const admin = { id: 'a', role: 'admin' as const, departmentId: null };
const member = { id: 'm', role: 'member' as const, departmentId: 2 };

describe('canCloseEvent', () => {
  it('lets the department head close once the event has started', () => {
    assert.equal(canCloseEvent(head, event, at('15:29')), false);
    assert.equal(canCloseEvent(head, event, at('15:30')), true);
    // Long after the check-in window closed.
    assert.equal(canCloseEvent(head, event, at('19:00')), true);
    assert.equal(canCloseEvent(programsHead, event, at('16:00')), true);
  });

  it('lets admins close at any time', () => {
    assert.equal(canCloseEvent(admin, event, at('08:00')), true);
  });

  it('refuses other departments and members', () => {
    assert.equal(canCloseEvent(otherHead, event, at('16:00')), false);
    assert.equal(canCloseEvent(member, event, at('16:00')), false);
  });

  it('matches closableFrom', () => {
    assert.equal(closableFrom(admin, event), 0);
    assert.equal(closableFrom(head, event), at('15:30').getTime());
    assert.equal(closableFrom(otherHead, event), null);
  });
});

describe('canReopenEvent / canViewEventSummary', () => {
  it('reopen is for admins only', () => {
    assert.equal(canReopenEvent(admin), true);
    assert.equal(canReopenEvent({ ...admin, role: 'super_admin' }), true);
    assert.equal(canReopenEvent(head), false);
  });

  it('summary follows who can read the attendance', () => {
    assert.equal(canViewEventSummary(head, event), true);
    assert.equal(canViewEventSummary(programsHead, event), true);
    assert.equal(canViewEventSummary(otherHead, event), false);
  });
});

describe('pre-member access', () => {
  const base = {
    id: 'u',
    departmentId: null,
    emailVerified: true,
    memberRecordId: null,
    preMemberRecordId: null,
  };
  const guest = { ...base, role: 'member' as const };
  const linkedMember = { ...guest, memberRecordId: 12 };
  const preMember = { ...guest, preMemberRecordId: 3 };
  const unverifiedPre = { ...preMember, emailVerified: false };
  const staff = { ...base, role: 'admin' as const };

  it('derives the access level', () => {
    assert.equal(accessLevel(guest), 'guest');
    assert.equal(accessLevel(linkedMember), 'member');
    assert.equal(accessLevel(preMember), 'pre_member');
    assert.equal(accessLevel(unverifiedPre), 'guest');
    assert.equal(accessLevel(staff), 'staff');
  });

  it('never gives pre-members member access', () => {
    assert.equal(hasMemberAccess(preMember), false);
    assert.equal(hasPreMemberAccess(preMember), true);
    assert.equal(hasPreMemberAccess(unverifiedPre), false);
    assert.equal(canViewNotices(preMember), true);
    assert.equal(canViewNotices(guest), false);
  });

  it('shows events and notices by audience', () => {
    const ev = (audience: 'members' | 'pre_members' | 'everyone') => ({
      audience,
    });
    assert.equal(canViewEvent(linkedMember, ev('members')), true);
    assert.equal(canViewEvent(linkedMember, ev('everyone')), true);
    assert.equal(canViewEvent(linkedMember, ev('pre_members')), false);
    assert.equal(canViewEvent(preMember, ev('members')), false);
    assert.equal(canViewEvent(preMember, ev('pre_members')), true);
    assert.equal(canViewEvent(preMember, ev('everyone')), true);
    assert.equal(canViewEvent(guest, ev('everyone')), false);
    assert.equal(canSeeAudience(staff, 'pre_members'), true);
    assert.equal(canSeeAudience(staff, 'members'), true);
  });

  it('lets only admins manage pre-members', () => {
    assert.equal(canManagePreMembers(admin), true);
    assert.equal(canManagePreMembers(head), false);
    assert.equal(canManagePreMembers(programsHead), false);
    assert.equal(canManagePreMembers(member), false);
  });
});

describe('canViewPeople / canViewPersonAttendance', () => {
  const superAdmin = { id: 's', role: 'super_admin' as const, departmentId: null };
  // A plain member account in Programs & Events: no admin area.
  const programsMember = { id: 'pm', role: 'member' as const, departmentId: 3 };

  it('the list is for admins and Programs & Events staff', () => {
    assert.equal(canViewPeople(admin), true);
    assert.equal(canViewPeople(superAdmin), true);
    assert.equal(canViewPeople(programsHead), true);
    assert.equal(canViewPeople(head), false);
    assert.equal(canViewPeople(member), false);
    assert.equal(canViewPeople(programsMember), false);
  });

  it('everyone sees their own page, only staff see others', () => {
    const own = { authUserId: 'm' };
    const other = { authUserId: 'x' };
    assert.equal(canViewPersonAttendance(member, own), true);
    assert.equal(canViewPersonAttendance(member, other), false);
    assert.equal(canViewPersonAttendance(member, { authUserId: null }), false);
    assert.equal(canViewPersonAttendance(head, other), false);
    assert.equal(canViewPersonAttendance(programsHead, other), true);
    assert.equal(canViewPersonAttendance(admin, { authUserId: null }), true);
  });
});

describe('messages (SMS)', () => {
  const grantedHead = { ...head, canSendMessages: true };
  const plainHead = { ...head, canSendMessages: false };
  const superAdmin = { id: 's', role: 'super_admin' as const, departmentId: null, canSendMessages: false };
  const adminWithFlag = { ...admin, canSendMessages: true };
  const memberWithFlag = { ...member, canSendMessages: true };
  const headWithoutDept = { id: 'x', role: 'dept_head' as const, departmentId: null, canSendMessages: true };

  it('super admins always, department heads only when granted', () => {
    assert.equal(canSendMessages(superAdmin), true);
    assert.equal(canSendMessages(grantedHead), true);
    assert.equal(canSendMessages(plainHead), false);
    assert.equal(canSendMessages(headWithoutDept), false);
  });

  it('admins and members never, even with the flag', () => {
    assert.equal(canSendMessages(adminWithFlag), false);
    assert.equal(canSendMessages(memberWithFlag), false);
  });

  it('only super admins grant, only department heads can be granted', () => {
    assert.equal(canGrantMessaging(superAdmin), true);
    assert.equal(canGrantMessaging(admin), false);
    assert.equal(canGrantMessaging(head), false);
    assert.equal(canReceiveMessagingGrant({ role: 'dept_head' }), true);
    assert.equal(canReceiveMessagingGrant({ role: 'admin' }), false);
    assert.equal(canReceiveMessagingGrant({ role: 'member' }), false);
  });

  it('super admins see every broadcast, senders their own', () => {
    const own = { createdBy: grantedHead.id };
    const other = { createdBy: 'someone-else' };
    assert.equal(canViewBroadcast(superAdmin, other), true);
    assert.equal(canViewBroadcast(grantedHead, own), true);
    assert.equal(canViewBroadcast(grantedHead, other), false);
    assert.equal(canCancelBroadcast(grantedHead, other), false);
    // The right was taken away: not even their own.
    assert.equal(canViewBroadcast(plainHead, own), false);
    assert.equal(canViewBroadcast(adminWithFlag, { createdBy: admin.id }), false);
  });

  it('scheduled broadcasts: edited by the same people who may cancel them', () => {
    const own = { createdBy: grantedHead.id };
    const other = { createdBy: 'someone-else' };
    assert.equal(canEditBroadcast(superAdmin, other), true);
    assert.equal(canEditBroadcast(grantedHead, own), true);
    assert.equal(canEditBroadcast(grantedHead, other), false);
    assert.equal(canEditBroadcast(plainHead, own), false);
    assert.equal(canEditBroadcast(adminWithFlag, { createdBy: admin.id }), false);
    assert.equal(canEditBroadcast(memberWithFlag, { createdBy: memberWithFlag.id }), false);
  });

  it('event reminders: may edit the event and may send', () => {
    assert.equal(canSetEventReminder(grantedHead, { departmentId: 2 }), true);
    assert.equal(canSetEventReminder(grantedHead, { departmentId: 6 }), false);
    assert.equal(canSetEventReminder(plainHead, { departmentId: 2 }), false);
    assert.equal(canSetEventReminder(adminWithFlag, { departmentId: 2 }), false);
    assert.equal(canSetEventReminder(superAdmin, { departmentId: 6 }), true);
  });

  it('SMS opt-out: people with a linked record', () => {
    const base = { emailVerified: true, memberRecordId: null, preMemberRecordId: null };
    assert.equal(canChangeSmsOptOut(base), false);
    assert.equal(canChangeSmsOptOut({ ...base, memberRecordId: 1 }), true);
    assert.equal(canChangeSmsOptOut({ ...base, preMemberRecordId: 3 }), true);
    assert.equal(canChangeSmsOptOut({ ...base, memberRecordId: 1, emailVerified: false }), false);
  });
});

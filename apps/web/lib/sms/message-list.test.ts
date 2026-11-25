import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { BroadcastStatus } from '@felege-yordanos/db/schema';
import {
  creditOutlook,
  DEFAULT_MESSAGE_FILTERS,
  hasActiveFilters,
  matchesStatusFilter,
  messagesHref,
  messagesQuery,
  pageList,
  paging,
  parseMessageFilters,
  periodBounds,
  rowStatus,
  searchWords,
  senderScope,
  type MessageStatusFilter,
} from './message-list';

const UID = '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e';

describe('parseMessageFilters', () => {
  it('gives the defaults for an empty URL', () => {
    assert.deepEqual(parseMessageFilters({}), DEFAULT_MESSAGE_FILTERS);
  });

  it('reads every filter', () => {
    assert.deepEqual(
      parseMessageFilters({
        status: 'problem',
        sender: UID,
        period: 'last_month',
        q: '  meeting   Sunday ',
        page: '3',
        per: '25',
      }),
      { status: 'problem', sender: UID, period: 'last_month', q: 'meeting Sunday', page: 3, per: 25 },
    );
    assert.equal(parseMessageFilters({ sender: 'me' }).sender, 'me');
    assert.equal(parseMessageFilters({ period: 'all' }).period, 'all');
  });

  it('falls back to the default for unknown or out-of-range values', () => {
    const f = parseMessageFilters({
      status: 'cancelled',
      sender: 'not-a-user',
      period: 'last_year',
      page: '0',
      per: '20',
    });
    assert.equal(f.status, 'all');
    assert.equal(f.sender, 'all');
    assert.equal(f.period, 'this_month');
    assert.equal(f.page, 1);
    assert.equal(f.per, 10);
    assert.equal(parseMessageFilters({ page: '-2' }).page, 1);
    assert.equal(parseMessageFilters({ page: '2.5' }).page, 1);
    assert.equal(parseMessageFilters({ page: '9999999' }).page, 1);
    assert.equal(parseMessageFilters({ per: 'abc' }).per, 10);
  });

  it('takes the first of repeated parameters and caps the search', () => {
    assert.equal(parseMessageFilters({ status: ['done', 'scheduled'] }).status, 'done');
    assert.equal(parseMessageFilters({ q: 'x'.repeat(300) }).q.length, 100);
  });
});

describe('messagesQuery', () => {
  it('leaves the defaults out', () => {
    assert.equal(messagesQuery(DEFAULT_MESSAGE_FILTERS), '');
    assert.equal(messagesHref(DEFAULT_MESSAGE_FILTERS), '/admin/messages');
  });

  it('round-trips through the parser', () => {
    const f = parseMessageFilters({
      status: 'sending',
      sender: 'me',
      period: 'all',
      q: 'ጉባኤ',
      page: '2',
      per: '50',
    });
    const back = parseMessageFilters(Object.fromEntries(new URLSearchParams(messagesQuery(f))));
    assert.deepEqual(back, f);
  });

  it('goes back to page 1 when a filter changes', () => {
    const f = { ...DEFAULT_MESSAGE_FILTERS, page: 4 };
    assert.equal(messagesQuery(f, { status: 'done' }), 'status=done');
    assert.equal(messagesQuery(f, { per: 25 }), 'per=25');
    assert.equal(messagesQuery(f, { period: 'all' }), 'period=all');
  });

  it('keeps the filters when only the page changes', () => {
    const f = { ...DEFAULT_MESSAGE_FILTERS, status: 'done' as const, page: 4 };
    assert.equal(messagesQuery(f, { page: 5 }), 'status=done&page=5');
    assert.equal(messagesQuery(f, { page: 1 }), 'status=done');
  });
});

describe('hasActiveFilters and searchWords', () => {
  it('ignores page and rows per page', () => {
    assert.equal(hasActiveFilters({ ...DEFAULT_MESSAGE_FILTERS, page: 3, per: 50 }), false);
    assert.equal(hasActiveFilters({ ...DEFAULT_MESSAGE_FILTERS, period: 'all' }), true);
    assert.equal(hasActiveFilters({ ...DEFAULT_MESSAGE_FILTERS, q: 'x' }), true);
  });

  it('splits the search into at most 5 words', () => {
    assert.deepEqual(searchWords(''), []);
    assert.deepEqual(searchWords('a b'), ['a', 'b']);
    assert.equal(searchWords('1 2 3 4 5 6 7').length, 5);
  });
});

describe('senderScope', () => {
  const me = '00000000-0000-4000-8000-000000000001';
  it('limits everyone but super admins to their own messages', () => {
    assert.equal(senderScope({ sender: 'all' }, { id: me, superAdmin: false }), me);
    assert.equal(senderScope({ sender: UID }, { id: me, superAdmin: false }), me);
  });
  it('lets super admins choose', () => {
    assert.equal(senderScope({ sender: 'all' }, { id: me, superAdmin: true }), null);
    assert.equal(senderScope({ sender: 'me' }, { id: me, superAdmin: true }), me);
    assert.equal(senderScope({ sender: UID }, { id: me, superAdmin: true }), UID);
  });
});

describe('status chips and pills', () => {
  const ALL: BroadcastStatus[] = [
    'scheduled',
    'queued',
    'sending',
    'paused',
    'done',
    'cancelled',
    'missed',
  ];
  const under = (filter: MessageStatusFilter, failed = 0) =>
    ALL.filter((s) => matchesStatusFilter(filter, s, failed));

  it('All has every status, cancelled included', () => {
    assert.deepEqual(under('all'), ALL);
  });
  it('Sending is queued and sending', () => {
    assert.deepEqual(under('sending'), ['queued', 'sending']);
  });
  it('Scheduled and Done are one status each', () => {
    assert.deepEqual(under('scheduled'), ['scheduled']);
    assert.deepEqual(under('done'), ['done']);
    assert.deepEqual(under('done', 3), ['done']);
  });
  it('Paused or failed: paused, missed, and done with failed deliveries', () => {
    assert.deepEqual(under('problem'), ['paused', 'missed']);
    assert.deepEqual(under('problem', 1), ['paused', 'done', 'missed']);
  });
  it('cancelled appears under All only', () => {
    for (const f of ['scheduled', 'sending', 'done', 'problem'] as const)
      assert.equal(matchesStatusFilter(f, 'cancelled', 5), false);
  });
  it('shows queued as Sending', () => {
    assert.equal(rowStatus('queued'), 'sending');
    assert.equal(rowStatus('missed'), 'missed');
    assert.equal(rowStatus('cancelled'), 'cancelled');
  });
});

describe('periodBounds', () => {
  it('is null for all time', () => {
    assert.equal(periodBounds('all', '2026-11-20'), null);
  });

  it('is this Ethiopian month from Addis Ababa midnight to the next month', () => {
    // 2026-11-20 is Hidar 11, 2019; Hidar 1 = 2026-11-10, Tahsas 1 = 2026-12-10.
    const b = periodBounds('this_month', '2026-11-20');
    assert.ok(b);
    assert.equal(b.month.month, 3);
    assert.equal(b.month.year, 2019);
    assert.equal(b.from.toISOString(), '2026-11-09T21:00:00.000Z');
    assert.equal(b.to.toISOString(), '2026-12-09T21:00:00.000Z');
  });

  it('is last month right before this one', () => {
    const b = periodBounds('last_month', '2026-11-20');
    assert.ok(b);
    assert.equal(b.month.month, 2);
    assert.equal(b.from.toISOString(), '2026-10-10T21:00:00.000Z');
    assert.equal(b.to.toISOString(), '2026-11-09T21:00:00.000Z');
  });

  it('last month of Meskerem is the short Pagume', () => {
    // 2026-09-20 is Meskerem 10, 2019; Pagume 2018 = 2026-09-06 to 2026-09-10.
    const b = periodBounds('last_month', '2026-09-20');
    assert.ok(b);
    assert.equal(b.month.month, 13);
    assert.equal(b.from.toISOString(), '2026-09-05T21:00:00.000Z');
    assert.equal(b.to.toISOString(), '2026-09-10T21:00:00.000Z');
  });
});

describe('paging', () => {
  it('shows "1 to 10 of 47" on the first page', () => {
    assert.deepEqual(paging(47, 1, 10), { pages: 5, page: 1, offset: 0, first: 1, last: 10 });
  });
  it('ends at the total on the last page', () => {
    assert.deepEqual(paging(47, 5, 10), { pages: 5, page: 5, offset: 40, first: 41, last: 47 });
  });
  it('shows the last page for a page past the end', () => {
    assert.deepEqual(paging(47, 99, 10), paging(47, 5, 10));
    assert.equal(paging(47, 3, 25).page, 2);
  });
  it('has one empty page when there is nothing', () => {
    assert.deepEqual(paging(0, 3, 10), { pages: 1, page: 1, offset: 0, first: 0, last: 0 });
  });
  it('fits an exact multiple', () => {
    assert.equal(paging(50, 1, 50).pages, 1);
    assert.equal(paging(51, 1, 50).pages, 2);
  });
});

describe('pageList', () => {
  it('lists every page when there are few', () => {
    assert.deepEqual(pageList(1, 1), [1]);
    assert.deepEqual(pageList(2, 5), [1, 2, 3, 4, 5]);
  });
  it('puts gaps around the current page', () => {
    assert.deepEqual(pageList(1, 10), [1, 2, 'gap', 10]);
    assert.deepEqual(pageList(5, 10), [1, 'gap', 4, 5, 6, 'gap', 10]);
    assert.deepEqual(pageList(10, 10), [1, 'gap', 9, 10]);
  });
  it('shows a single left-out page instead of a gap', () => {
    assert.deepEqual(pageList(4, 10), [1, 2, 3, 4, 5, 'gap', 10]);
    assert.deepEqual(pageList(3, 5), [1, 2, 3, 4, 5]);
  });
});

describe('creditOutlook', () => {
  const now = new Date('2026-11-20T06:00:00Z');
  const inDays = (d: number) => new Date(now.getTime() + d * 24 * 3600 * 1000);

  it('adds up the next 7 days only', () => {
    const r = creditOutlook(
      [
        { at: inDays(1), credits: 30 },
        { at: inDays(6.9), credits: 20 },
        { at: inDays(8), credits: 500 },
      ],
      1000,
      now,
    );
    assert.deepEqual(r, { needed: 50, short: null });
  });

  it('names the first message the balance no longer covers', () => {
    const r = creditOutlook(
      [
        { at: inDays(3), credits: 40 },
        { at: inDays(1), credits: 30 },
        { at: inDays(2), credits: null },
      ],
      50,
      now,
    );
    assert.equal(r.needed, 70);
    assert.deepEqual(r.short, { at: inDays(3), needed: 70 });
  });

  it('never warns without a balance', () => {
    assert.equal(creditOutlook([{ at: inDays(1), credits: 999 }], null, now).short, null);
  });

  it('is enough when the balance equals the need', () => {
    assert.equal(creditOutlook([{ at: inDays(1), credits: 50 }], 50, now).short, null);
  });
});

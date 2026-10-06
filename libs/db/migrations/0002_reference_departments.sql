-- Reference data: the 9 Sunday School departments.
-- lib/permissions.ts and the admin screens rely on these ids, so every
-- database (local, CI, staging, production) gets them through migrations.
-- ON CONFLICT keeps existing rows (for example from the dev seed) unchanged.
INSERT INTO "departments" ("id", "name_en", "name_am") VALUES
  (1, 'Planning, Implementation & Monitoring', 'እቅድ ትግበራ እና ክትትል ክፍል'),
  (2, 'Education & Training', 'ትምህርት እና ስልጠና ክፍል'),
  (3, 'Programs & Events', 'መርሐ ግብር እና ጉባኤያት ክፍል'),
  (4, 'Human Resources / People Operations', 'የሰው ሀብት አስተዳደር ክፍል'),
  (5, 'Information & Internal Communications', 'የመረጃ እና ውስጥ ግንኙነት ክፍል'),
  (6, 'Songs & Celebrations', 'የመዝሙር እና በዓላት ክፍል'),
  (7, 'Arts & Culture', 'የኪነጥበብ እና ሥነጥበብ ክፍል'),
  (8, 'Development & Charity', 'የልማት እና በጎ አድራጎት ክፍል'),
  (9, 'Budget & Asset Management', 'የበጀት እና ንብረት አስተዳደር ክፍል')
ON CONFLICT ("id") DO NOTHING;

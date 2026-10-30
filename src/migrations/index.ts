import * as migration_20261020_201226_initial_users_media from './20261020_201226_initial_users_media';
import * as migration_20261022_180524_s02_auth_audit_storage_globals from './20261022_180524_s02_auth_audit_storage_globals';
import * as migration_20261022_211945_s03_group_profile_lines_pages_redirects from './20261022_211945_s03_group_profile_lines_pages_redirects';
import * as migration_20261030_120504_s04_people_memberships_consents from './20261030_120504_s04_people_memberships_consents';
import * as migration_20261030_161821_s05_essays_categories_tags_jobs from './20261030_161821_s05_essays_categories_tags_jobs';

export const migrations = [
  {
    up: migration_20261020_201226_initial_users_media.up,
    down: migration_20261020_201226_initial_users_media.down,
    name: '20261020_201226_initial_users_media',
  },
  {
    up: migration_20261022_180524_s02_auth_audit_storage_globals.up,
    down: migration_20261022_180524_s02_auth_audit_storage_globals.down,
    name: '20261022_180524_s02_auth_audit_storage_globals',
  },
  {
    up: migration_20261022_211945_s03_group_profile_lines_pages_redirects.up,
    down: migration_20261022_211945_s03_group_profile_lines_pages_redirects.down,
    name: '20261022_211945_s03_group_profile_lines_pages_redirects',
  },
  {
    up: migration_20261030_120504_s04_people_memberships_consents.up,
    down: migration_20261030_120504_s04_people_memberships_consents.down,
    name: '20261030_120504_s04_people_memberships_consents',
  },
  {
    up: migration_20261030_161821_s05_essays_categories_tags_jobs.up,
    down: migration_20261030_161821_s05_essays_categories_tags_jobs.down,
    name: '20261030_161821_s05_essays_categories_tags_jobs'
  },
];

import * as migration_20261020_201226_initial_users_media from './20261020_201226_initial_users_media';

export const migrations = [
  {
    up: migration_20261020_201226_initial_users_media.up,
    down: migration_20261020_201226_initial_users_media.down,
    name: '20261020_201226_initial_users_media'
  },
];

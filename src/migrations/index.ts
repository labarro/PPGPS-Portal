import * as migration_20261020_201226_initial_users_media from './20261020_201226_initial_users_media';
import * as migration_20261020_210529_prova_drift_probe from './20261020_210529_prova_drift_probe';

export const migrations = [
  {
    up: migration_20261020_201226_initial_users_media.up,
    down: migration_20261020_201226_initial_users_media.down,
    name: '20261020_201226_initial_users_media',
  },
  {
    up: migration_20261020_210529_prova_drift_probe.up,
    down: migration_20261020_210529_prova_drift_probe.down,
    name: '20261020_210529_prova_drift_probe'
  },
];

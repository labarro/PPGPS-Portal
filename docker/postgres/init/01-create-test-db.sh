#!/bin/sh
# Cria o banco usado pelos testes de integração/E2E (executado só na criação do volume).
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE DATABASE ppgps_test OWNER "$POSTGRES_USER";
EOSQL

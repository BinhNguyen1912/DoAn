import { DefaultNamingStrategy, type NamingStrategyInterface } from 'typeorm';

const toSnake = (value: string): string => value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

/** Maps camelCase properties to snake_case columns so entities stay idiomatic. */
export class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  override columnName(propertyName: string, customName: string | undefined, prefixes: string[]): string {
    return toSnake(customName ?? [...prefixes, propertyName].join('_'));
  }
}

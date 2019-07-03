export default class damageUtils {
  /***
     * Returns expected damage multiplier based on whether
     * the action is guaranteed to crit or not. 
     * 
     * if sureCrit
     *   return 1 * crit multi
     * else
     *   return crit chance * crit multi + (1 - crit chance)
     */
  static getExpectedCritDamageMultiplier(doll, action) {
    const critMulti = 1 + (doll.battle.critdmg / 100);
    if ('sureCrit' in action) {
      return critMulti;
    } else {
      const critChance = (doll.battle.crit / 100);
      return critChance * critMulti + (1 - critChance);
    }
  }

  /***
     * Returns the number of enemy links hit by an effect
     * based on the effect's radius and the number of
     * enemies on field. Each enemy is assumed to have
     * 5 links unless isBoss is true.
     */
  static getNumEnemyLinksHit(radius, enemyCount, isBoss) {
    const linksPerEnemy = isBoss ? 1 : 5;
    let maxEnemiesHit;
    if (radius <= 0)
      maxEnemiesHit = enemyCount;
    else if (radius <= 1)
      maxEnemiesHit = 1;
    else if (radius <= 1.5)
      maxEnemiesHit = 5;
    else if (radius <= 2)
      maxEnemiesHit = 9;
    else if (radius <= 2.5)
      maxEnemiesHit = 11;
    else if (radius <= 3)
      maxEnemiesHit = 15;
    else if (radius <= 3.5)
      maxEnemiesHit = 17;
    else if (radius <= 4)
      maxEnemiesHit = 21;
    else
      maxEnemiesHit = enemyCount;

    return Math.min(maxEnemiesHit, enemyCount) * linksPerEnemy;
  }
}

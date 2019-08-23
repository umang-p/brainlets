import math, json
from functools import reduce

'''
tiles, stats, and skill are the most tedious parts of adding new dolls
this quick and dirty script should help out with tiles/stats.
skills should be done manually to ensure accuracy
'''

TYPE_SCALARS = [
  { 'hp': 0.6, 'fp': 0.6, 'rof': 0.8, 'acc': 1.2, 'eva': 1.8, 'armor': 0 }, #hg
  { 'hp': 1.6, 'fp': 0.6, 'rof': 1.2, 'acc': 0.3, 'eva': 1.6, 'armor': 0 }, #smg
  { 'hp': 0.8, 'fp': 2.4, 'rof': 0.5, 'acc': 1.6, 'eva': 0.8, 'armor': 0 }, #rf
  { 'hp': 1.0, 'fp': 1.0, 'rof': 1.0, 'acc': 1.0, 'eva': 1.0, 'armor': 0 }, #ar
  { 'hp': 1.5, 'fp': 1.8, 'rof': 1.6, 'acc': 0.6, 'eva': 0.6, 'armor': 0 }, #mg
  { 'hp': 2.0, 'fp': 0.7, 'rof': 0.4, 'acc': 0.3, 'eva': 0.3, 'armor': 1 }, #sg
]

GROWTH_FACTORS = {
  'mod': {
    'basic': {
      'hp': [96.283, 0.138],
      'armor': [13.979, 0.04],
      'eva': [5],
      'acc': [5],
      'fp': [16],
      'rof': [45],
    },
    'grow': {
      'eva': [0.075, 22.572],
      'acc': [0.075, 22.572],
      'fp': [0.06, 18.018],
      'rof': [0.022, 15.741]
    }
  },
  'normal': {
    'basic': {
      'hp': [55, 0.555],
      'armor': [2, 0.161],
      'eva': [5],
      'acc': [5],
      'fp': [16],
      'rof': [45],
    },
    'grow': {
      'eva': [0.303, 0],
      'acc': [0.303, 0],
      'fp': [0.242, 0],
      'rof': [0.181, 0]
    }
  }
}

GUN_TYPES = { 'hg':1, 'smg':2, 'rf':3, 'ar':4, 'mg':5, 'sg':6}

TILE_POSITIONS = { 1:12, 2:13, 3:14, 4:22, 5:23, 6:27, 7:32, 8:33, 9:34}

def calculate_base_stats(level, type, doll_stat_data):
    doll_type_scalars = TYPE_SCALARS[type - 1]
    basic_factors = GROWTH_FACTORS['mod']['basic'] if level > 100 else GROWTH_FACTORS['normal']['basic']
    grow_factors = GROWTH_FACTORS['mod']['grow'] if level > 100 else GROWTH_FACTORS['normal']['grow']

    doll_stats = {}
    doll_stats['hp'] = math.ceil((basic_factors['hp'][0] + ((level - 1) * basic_factors['hp'][1])) * doll_type_scalars['hp'] * doll_stat_data['hp'] / 100)

    doll_stats['fp'] = math.ceil(basic_factors['fp'][0] * doll_type_scalars['fp'] * doll_stat_data['fp'] / 100)
    doll_stats['fp'] += math.ceil((grow_factors['fp'][1] + ((level - 1) * grow_factors['fp'][0])) * doll_type_scalars['fp'] * doll_stat_data['fp'] * doll_stat_data['growth_rating'] / 100 / 100)

    doll_stats['acc'] = math.ceil(basic_factors['acc'][0] * doll_type_scalars['acc'] * doll_stat_data['acc'] / 100)
    doll_stats['acc'] += math.ceil((grow_factors['acc'][1] + ((level - 1) * grow_factors['acc'][0])) * doll_type_scalars['acc'] * doll_stat_data['acc'] * doll_stat_data['growth_rating'] / 100 / 100)

    doll_stats['eva'] = math.ceil(basic_factors['eva'][0] * doll_type_scalars['eva'] * doll_stat_data['eva'] / 100)
    doll_stats['eva'] += math.ceil((grow_factors['eva'][1] + ((level - 1) * grow_factors['eva'][0])) * doll_type_scalars['eva'] * doll_stat_data['eva'] * doll_stat_data['growth_rating'] / 100 / 100)

    doll_stats['rof'] = math.ceil(basic_factors['rof'][0] * doll_type_scalars['rof'] * doll_stat_data['rof'] / 100)
    doll_stats['rof'] += math.ceil((grow_factors['rof'][1] + ((level - 1) * grow_factors['rof'][0])) * doll_type_scalars['rof'] * doll_stat_data['rof'] * doll_stat_data['growth_rating'] / 100 / 100)

    doll_stats['armor'] = math.ceil((basic_factors['armor'][0] + ((level - 1) * basic_factors['armor'][1])) * doll_type_scalars['armor'] * doll_stat_data['armor'] / 100)

    return doll_stats

def calculate_stat_data(type, min_stats, max_stats, min_level, max_level):
    doll_type_scalars = TYPE_SCALARS[type - 1]
    min_lvl_basic_factors = GROWTH_FACTORS['mod']['basic'] if min_level > 100 else GROWTH_FACTORS['normal']['basic']
    max_lvl_basic_factors = GROWTH_FACTORS['mod']['basic'] if max_level > 100 else GROWTH_FACTORS['normal']['basic']

    stat_data = { 'hp':0, 'fp':0, 'acc':0, 'eva':0, 'rof':0, 'armor':0, 'growth_rating':0}

    hp_data_1 = 100 * min_stats['hp'] / ((min_lvl_basic_factors['hp'][0] + ((min_level - 1) * min_lvl_basic_factors['hp'][1])) * doll_type_scalars['hp'])
    hp_data_2 = 100 * max_stats['hp'] / ((max_lvl_basic_factors['hp'][0] + ((max_level - 1) * max_lvl_basic_factors['hp'][1])) * doll_type_scalars['hp'])
    stat_data['hp'] = math.floor(min(hp_data_1, hp_data_2))

    if max_stats['armor'] != 0:
        armor_data_1 = 100 * min_stats['armor'] / ((min_lvl_basic_factors['armor'][0] + ((min_level - 1) * min_lvl_basic_factors['armor'][1])) * doll_type_scalars['armor'])
        armor_data_2 = 100 * max_stats['armor'] / ((max_lvl_basic_factors['armor'][0] + ((max_level - 1) * max_lvl_basic_factors['armor'][1])) * doll_type_scalars['armor'])
        stat_data['armor'] = math.floor(min(armor_data_1, armor_data_2))
    else:
        stat_data['armor'] = 0

    stat_data['fp'] = math.ceil((min_stats['fp']-0.99) * 100 / (min_lvl_basic_factors['fp'][0] * doll_type_scalars['fp']))
    stat_data['acc'] = math.ceil((min_stats['acc']-0.99) * 100 / (min_lvl_basic_factors['acc'][0] * doll_type_scalars['acc']))
    stat_data['eva'] = math.ceil((min_stats['eva']-0.99) * 100 / (min_lvl_basic_factors['eva'][0] * doll_type_scalars['eva']))
    stat_data['rof'] = math.ceil((min_stats['rof']-0.99) * 100 / (min_lvl_basic_factors['rof'][0] * doll_type_scalars['rof']))

    stats = calculate_base_stats(max_level, type, stat_data)
    while stats['fp'] <= max_stats['fp'] and stats['acc'] <= max_stats['acc'] and stats['eva'] <= max_stats['eva'] and stats['rof'] <= max_stats['rof']:
        stat_data['growth_rating'] += 1
        stats = calculate_base_stats(max_level, type, stat_data)
    stat_data['growth_rating'] -= 1

    stats = calculate_base_stats(max_level, type, stat_data)
    while stats['fp'] < max_stats['fp'] or stats['acc'] < max_stats['acc'] or stats['eva'] < max_stats['eva'] or stats['rof'] < max_stats['rof']:
        if stats['fp'] < max_stats['fp']:
            stat_data['fp'] += 1
        if stats['acc'] < max_stats['acc']:
            stat_data['acc'] += 1
        if stats['eva'] < max_stats['eva']:
            stat_data['eva'] += 1
        if stats['rof'] < max_stats['rof']:
            stat_data['rof'] += 1
        stats = calculate_base_stats(max_level, type, stat_data)

    return stat_data

def main():
    max_stats = {}
    min_stats = {}
    min_stats['hp'] = int(input('min hp:'))
    max_stats['hp'] = int(input('max hp:'))
    min_stats['fp'] = int(input('min fp:'))
    max_stats['fp'] = int(input('max fp:'))
    min_stats['acc'] = int(input('min acc:'))
    max_stats['acc'] = int(input('max acc:'))
    min_stats['eva'] = int(input('min eva:'))
    max_stats['eva'] = int(input('max eva:'))
    min_stats['rof'] = int(input('min rof:'))
    max_stats['rof'] = int(input('max rof:'))
    min_stats['armor'] = int(input('min armor:'))
    max_stats['armor'] = int(input('max armor:'))

    type = GUN_TYPES[input('gun type (hg,ar,rf,smg,sg,mg):')]

    digimind = True if input('digimind (y/n):').startswith('y') else False

    min_level = 1
    max_level = 120 if digimind else 100

    data = calculate_stat_data(type, min_stats, max_stats, min_level, max_level)

    print('tile info:')
    tile_data = {}
    tile_data['tiles'] = {}
    tile_data['tiles']['self'] = TILE_POSITIONS[int(input('position doll stands on (1-9):'))]
    tile_data['tiles']['target'] = reduce((lambda a,b: a + ',' + b), map((lambda x: str(TILE_POSITIONS[int(x)] - tile_data['tiles']['self'])), input('positions affect by doll (1-9)').split(' ')))
    tile_data['tiles']['target_type'] = list(map((lambda x: GUN_TYPES[x]), input('types of dolls affected by tiles (hg,ar,rf,smg,sg,mg):').split(' ')))
    print('tile effects:')
    tile_data['tiles']['effect'] = {}
    tile_data['tiles']['effect']['fp'] = int(input('fp:')) if type != 1 else list(map((lambda x: int(x)), input('fp:').split(' ')))
    tile_data['tiles']['effect']['acc'] = int(input('acc:')) if type != 1 else list(map((lambda x: int(x)), input('acc:').split(' ')))
    tile_data['tiles']['effect']['eva'] = int(input('eva:')) if type != 1 else list(map((lambda x: int(x)), input('eva:').split(' ')))
    tile_data['tiles']['effect']['rof'] = int(input('rof:')) if type != 1 else list(map((lambda x: int(x)), input('rof:').split(' ')))
    tile_data['tiles']['effect']['crit'] = int(input('crit:')) if type != 1 else list(map((lambda x: int(x)), input('crit:').split(' ')))
    tile_data['tiles']['effect']['skillcd'] = int(input('skillcd:')) if type != 1 else list(map((lambda x: int(x)), input('skillcd:').split(' ')))
    tile_data['tiles']['effect']['armor'] = int(input('armor:')) if type != 1 else list(map((lambda x: int(x)), input('armor:').split(' ')))

    print(json.dumps(tile_data, indent=2))
    print('stat_data:'+json.dumps(data, indent=2))
    print('calculated min stats:'+json.dumps(calculate_base_stats(min_level, type, data), indent=2))
    print('actual min stats:'+json.dumps(min_stats, indent=2))
    print('calculated max stats:'+json.dumps(calculate_base_stats(max_level, type, data), indent=2))
    print('actual max stats:'+json.dumps(max_stats, indent=2))

if __name__ == '__main__':
    main()

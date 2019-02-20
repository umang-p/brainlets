from django.shortcuts import render
from django.conf import settings
from operator import itemgetter
import json

# Create your views here.
def coming_soon(request):
  return render(request, 'girlsfrontline/coming_soon.html')

def battery_calculator(request):
    return render(request, 'girlsfrontline/battery_calculator.html')

def home(request):
    return render(request, 'girlsfrontline/home.html')

def sim(request):
    return render(request, 'girlsfrontline/sim.html')

def equip_timers(request):
    with open(settings.STATIC_ROOT+'/girlsfrontline/equips.json', encoding='utf-8', mode='r') as data:
        equip_info = json.load(data)

    equip_list = []
    for equip in equip_info:
        if equip['en_craftable'] == True:
            info = {}
            info['hours'] = '{0:0>2.0f}'.format(int(equip['construct_time']) / 60 // 60)
            info['minutes'] = '{0:0>2.0f}'.format(int(equip['construct_time']) / 60 % 60)
            info['rarity'] = int(equip['rarity'])
            info['type'] = __get_equip_type(equip['type'])
            equip_list.append(info)

    equip_list = sorted(equip_list, key=itemgetter('hours','minutes'))

    return render(request, 'girlsfrontline/equip_timers.html', {"equip_list" : equip_list})

def doll_timers(request):
    with open(settings.STATIC_ROOT+'/girlsfrontline/dolls.json', encoding='utf-8', mode='r') as data:
        doll_info = json.load(data)

    doll_list = []
    for doll in doll_info:
        if doll['en_craftable'] == True:
            info = {}
            info['name'] = doll['name']
            info['hours'] = '{0:0>2.0f}'.format(int(doll['construct_time']) / 60 // 60)
            info['minutes'] = '{0:0>2.0f}'.format(int(doll['construct_time']) / 60 % 60)
            info['rarity'] = int(doll['rarity'])
            info['type'] = __get_doll_type(doll['type'])
            doll_list.append(info)

    doll_list = sorted(doll_list, key=itemgetter('hours','minutes'))

    return render(request, 'girlsfrontline/doll_timers.html', {"doll_list" : doll_list})

def __get_doll_type(doll_type):
    doll_type = int(doll_type)
    if doll_type == 1:
        return 'HG'
    elif doll_type == 2:
        return 'SMG'
    elif doll_type == 3:
        return 'RF'
    elif doll_type == 4:
        return 'AR'
    elif doll_type == 5:
        return 'MG'
    elif doll_type == 6:
        return 'SG'
    else:
        return 'error'

def __get_equip_type(equip_type):
    equip_type = int(equip_type)
    if equip_type == 1:
        return 'scope'
    elif equip_type == 2:
        return 'EOT'
    elif equip_type == 3:
        return 'red_dot_sight'
    elif equip_type == 4:
        return 'PEQ'
    elif equip_type == 5:
        return 'ap_ammo'
    elif equip_type == 6:
        return 'hp_ammo'
    elif equip_type == 7:
        return 'slug'
    elif equip_type == 8:
        return 'hv_ammo'
    elif equip_type == 9:
        return 'buck'
    elif equip_type == 10:
        return 'x_exo'
    elif equip_type == 11:
        return 'armor'
    elif equip_type == 12:
        return 't_exo'
    elif equip_type == 13:
        return 'suppressor'
    elif equip_type == 14:
        return 'ammo_box'
    elif equip_type == 15:
        return 'cape'
    else:
        return 'error'

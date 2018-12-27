from django.urls import path

from . import views

app_name = 'girlsfrontline'
urlpatterns = [
	path('', views.home, name='home'),
	path('batterycalculator/', views.battery_calculator, name='batterycalculator'),
	path('dailies/', views.coming_soon, name='dailies'),
	path('equiptimers/', views.equip_timers, name='equiptimers'),
	path('dolltimers/', views.doll_timers, name='dolltimers'),
	path('sim/', views.sim, name='sim'),
]

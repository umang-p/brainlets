from django.urls import path

from . import views

app_name = 'girlsfrontline'
urlpatterns = [
	path('', views.coming_soon, name='home'),
	path('batterycalc/', views.coming_soon, name='batterycalc'),
]
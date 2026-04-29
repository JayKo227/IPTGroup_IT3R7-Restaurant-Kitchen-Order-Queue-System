from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('kitchen', '0002_user_profile_picture_alter_user_is_active'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='middle_name',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
    ]

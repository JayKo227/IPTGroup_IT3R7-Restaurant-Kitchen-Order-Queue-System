from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('kitchen', '0003_user_middle_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='menuitem',
            name='image',
            field=models.FileField(blank=True, null=True, upload_to='menu_item_images/'),
        ),
    ]

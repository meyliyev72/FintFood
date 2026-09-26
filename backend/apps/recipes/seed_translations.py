"""uz / ru / en labels for the seeded catalog.

Category, ingredient-category and ingredient names appear in navigation and
filter controls, so they must read naturally in every supported language
(§3.3). User-generated content (recipe titles, descriptions, steps, reviews)
is deliberately NOT translated — it is stored exactly as the author wrote it.

Keys are the canonical English names used in ``seed_content.py``. Missing keys
are tolerated: the base ``name`` column is used as the fallback.
"""

# ---------------------------------------------------------------------------
# Ingredient categories
# ---------------------------------------------------------------------------

INGREDIENT_CATEGORY_TRANSLATIONS = {
    "Vegetables": ("Sabzavotlar", "Овощи", "Vegetables"),
    "Meat": ("Mol go'shti", "Мясо", "Meat"),
    "Chicken": ("Tovuq", "Курица", "Chicken"),
    "Fish": ("Baliq", "Рыба", "Fish"),
    "Dairy": ("Sut mahsulotlari", "Молочные продукты", "Dairy"),
    "Eggs": ("Tuxum", "Яйца", "Eggs"),
    "Grains": ("Don mahsulotlari", "Крупы и злаки", "Grains"),
    "Fruits": ("Mevalar", "Фрукты", "Fruits"),
    "Spices": ("Ziravorlar", "Специи", "Spices"),
    "Other": ("Boshqa", "Другое", "Other"),
}

# ---------------------------------------------------------------------------
# Recipe categories: name + description
# ---------------------------------------------------------------------------

CATEGORY_TRANSLATIONS = {
    "Breakfast": {
        "name": ("Nonushta", "Завтрак", "Breakfast"),
        "description": (
            "Sodda mahsulotlardan tayyorlangan to'yimli ertalabki taomlar.",
            "Сытные утренние блюда из простых продуктов.",
            "Wake up with hearty morning meals made from simple ingredients.",
        ),
    },
    "Lunch": {
        "name": ("Tushlik", "Обед", "Lunch"),
        "description": (
            "Band ish kunlari uchun yengil va to'ydiruvchi tushlik taomlari.",
            "Лёгкие и сытные блюда для напряжённого рабочего дня.",
            "Light, satisfying midday dishes for busy schedules.",
        ),
    },
    "Dinner": {
        "name": ("Kechki ovqat", "Ужин", "Dinner"),
        "description": (
            "Butun oila uchun to'yimli kechki taomlar.",
            "Сытные ужины для всей семьи.",
            "Hearty dinners for the whole family.",
        ),
    },
    "Desserts": {
        "name": ("Shirinliklar", "Десерты", "Desserts"),
        "description": (
            "Shirin tugunlar — tortlar, пирогlar va kichik shirinliklar.",
            "Сладкие финалы — торты, пироги и пирожные.",
            "Sweet endings — cakes, pies, tarts and treats.",
        ),
    },
    "Soups": {
        "name": ("Shorbalar", "Супы", "Soups"),
        "description": (
            "Isituvchi sho'rmalar, borsch va yumshoq shorbalar.",
            "Тёплые бульоны, борщ и нежные супы.",
            "Warming broths, borscht and creamy soups.",
        ),
    },
    "Salads": {
        "name": ("Salatlar", "Салаты", "Salads"),
        "description": (
            "Yangi, qarsildoq va rangli salatlar.",
            "Свежие, хрустящие и яркие салаты.",
            "Fresh, crunchy and vibrant salads.",
        ),
    },
    "Fast Food": {
        "name": ("Fastfud", "Фастфуд", "Fast Food"),
        "description": (
            "Tez tayyorlanadigan shawarma, burger va ko'cha taomlari.",
            "Быстрые шаурма, бургеры и уличные блюда.",
            "Quick shawarma, burgers and street-style favorites.",
        ),
    },
    "Uzbek Cuisine": {
        "name": ("O'zbek oshxi", "Узбекская кухня", "Uzbek Cuisine"),
        "description": (
            "Markaziy Osiyoning timeless taomlari — plov, manti, lagman va boshqalar.",
            "Нестареющие блюда Центральной Азии — плов, манты, лагман и многое другое.",
            "Timeless dishes of Central Asia — plov, manti, lagman and more.",
        ),
    },
    "Baking": {
        "name": ("Pishirish", "Выпечка", "Baking"),
        "description": (
            "Nonlar, pechenyelar va tandirda pishirilgan mahsulotlar.",
            "Хлеб, pastry и изделия из духовки.",
            "Breads, pastries and oven-baked goods.",
        ),
    },
    "Vegetarian": {
        "name": ("Vegetarian", "Вегетарианская", "Vegetarian"),
        "description": (
            "Go'shtsiz asosiy taomlar va garnirlar.",
            "Основные блюда и гарниры без мяса.",
            "Meat-free mains and sides that everyone will love.",
        ),
    },
    "Meat Dishes": {
        "name": ("Mol go'shtli taomlar", "Мясные блюда", "Meat Dishes"),
        "description": (
            "Mol, qo'ynesshi va tovuq go'shtidan tayyorlangan taomlar.",
            "Блюда из говядины, баранины и птицы.",
            "Beef, lamb and poultry mains cooked with care.",
        ),
    },
    "Poultry": {
        "name": ("Tovuqli taomlar", "Блюда из птицы", "Poultry"),
        "description": (
            "Dunyo bo'ylab tovuq va indiuk taomlari.",
            "Куриные и индейные блюда со всего мира.",
            "Chicken and turkey dishes from around the world.",
        ),
    },
    "Seafood": {
        "name": ("Dengiz mahsulotlari", "Морепродукты", "Seafood"),
        "description": (
            "Losos, kreb va yangi baliq retseplari.",
            "Рецепты с лососем, креветками и свежей рыбой.",
            "Salmon, shrimp and fresh-catch recipes.",
        ),
    },
    "Appetizers": {
        "name": ("Oldindan taomlar", "Закуски", "Appetizers"),
        "description": (
            "Bo'lishish uchun oldindan taomlar va gazaklar.",
            "Закуски и снеки для компании.",
            "Starters and snacks for sharing.",
        ),
    },
    "Drinks": {
        "name": ("Ichimliklar", "Напитки", "Drinks"),
        "description": (
            "Uyda tayyorlanadigan ichimliklar, smoothie va kompotlar.",
            "Домашние напитки, смузи и компоты.",
            "Homemade drinks, smoothies and compotes.",
        ),
    },
}

# ---------------------------------------------------------------------------
# Ingredients
# ---------------------------------------------------------------------------

INGREDIENT_TRANSLATIONS = {
    # Vegetables
    "Potato": ("Kartoshka", "Картофель", "Potato"),
    "Onion": ("Piyoz", "Лук", "Onion"),
    "Carrot": ("Sabzi", "Морковь", "Carrot"),
    "Tomato": ("Pomidor", "Помидор", "Tomato"),
    "Cucumber": ("Bodring", "Огурец", "Cucumber"),
    "Bell Pepper": ("Qalampir", "Болгарский перец", "Bell Pepper"),
    "Garlic": ("Sarimsoq", "Чеснок", "Garlic"),
    "Cabbage": ("Karam", "Капуста", "Cabbage"),
    "Spinach": ("Ispanak", "Шпинат", "Spinach"),
    "Zucchini": ("Kabocha", "Кабачок", "Zucchini"),
    "Eggplant": ("Baqlajon", "Баклажан", "Eggplant"),
    "Pumpkin": ("Qovoq", "Тыква", "Pumpkin"),
    "Radish": ("Turp", "Редис", "Radish"),
    "Sweet Corn": ("Makkajo'xori", "Кукуруза", "Sweet Corn"),
    "Mushroom": ("Qo'ziqorin", "Грибы", "Mushroom"),
    "Broccoli": ("Brokkoli", "Брокколи", "Broccoli"),
    "Lettuce": ("Salat", "Салат", "Lettuce"),
    "Green Beans": ("Yashil loq", "Зелёная фасоль", "Green Beans"),
    "Leek": ("Porey", "Лук-порей", "Leek"),
    "Celery": ("Selderey", "Сельдерей", "Celery"),
    "Peas": ("Nozok", "Горох", "Peas"),
    "Chili Pepper": ("Achchiq qalampir", "Острый перец", "Chili Pepper"),
    "Beetroot": ("Chig'on", "Свёкла", "Beetroot"),
    # Meat
    "Beef": ("Mol go'shti", "Говядина", "Beef"),
    "Lamb": ("Qo'ynesshi", "Баранина", "Lamb"),
    "Pork": ("Cho'chqa go'shti", "Свинина", "Pork"),
    "Ground Beef": ("Qiyma mol go'shti", "Молотый фарш", "Ground Beef"),
    "Beef Brisket": ("Mol go'shti (to'sh)", "Грудка говяжья", "Beef Brisket"),
    "Bacon": ("Bekon", "Бекон", "Bacon"),
    "Chicken Liver": ("Tovuq jigar", "Печень куриная", "Chicken Liver"),
    # Chicken
    "Chicken": ("Tovuq", "Курица", "Chicken"),
    "Chicken Thighs": ("Tovuq soni", "Бедро куриное", "Chicken Thighs"),
    "Chicken Breast": ("Tovuq ko'krak go'shti", "Куриная грудка", "Chicken Breast"),
    "Chicken Wings": ("Tovuq qanot", "Крылышки куриные", "Chicken Wings"),
    "Chicken Drumsticks": ("Tovuq tovon go'shti", "Голеностопы куриные", "Chicken Drumsticks"),
    # Fish
    "Fish": ("Baliq", "Рыба", "Fish"),
    "Salmon": ("Losos", "Лосось", "Salmon"),
    "Mackerel": ("Skumbriya", "Скумбрия", "Mackerel"),
    "White Fish Fillet": ("Oq baliq filesi", "Филе белой рыбы", "White Fish Fillet"),
    "Shrimp": ("Kreb", "Креветки", "Shrimp"),
    # Dairy
    "Milk": ("Sut", "Молоко", "Milk"),
    "Butter": ("Sariyog'", "Сливочное масло", "Butter"),
    "Cheddar Cheese": ("Cheddar pishlog'i", "Сыр чеддер", "Cheddar Cheese"),
    "Cream": ("Krem", "Сливки", "Cream"),
    "Yogurt": ("Yog'urt", "Йогурт", "Yogurt"),
    "Sour Cream": ("Achchiq krem", "Сметана", "Sour Cream"),
    "Mozzarella": ("Mozzarella", "Моцарелла", "Mozzarella"),
    "Parmesan": ("Parmesan", "Пармезан", "Parmesan"),
    "Feta": ("Feta", "Фета", "Feta"),
    "Cream Cheese": ("Krem pishlog'", "Сыр сливочный", "Cream Cheese"),
    # Eggs
    "Egg": ("Tuxum", "Яйцо", "Egg"),
    # Grains
    "Rice": ("Guruch", "Рис", "Rice"),
    "Flour": ("Un", "Мука", "Flour"),
    "Pasta": ("Makaron", "Паста", "Pasta"),
    "Bread": ("Non", "Хлеб", "Bread"),
    "Noodles": ("Laksha", "Лапша", "Noodles"),
    "Couscous": ("Kuskus", "Кускус", "Couscous"),
    "Buckwheat": ("Grechka", "Гречка", "Buckwheat"),
    "Oats": ("Ovsyan", "Овсянка", "Oats"),
    "Lavash": ("Lavash", "Лаваш", "Lavash"),
    "Risotto Rice": ("Risotto guruchi", "Рис для ризотто", "Risotto Rice"),
    "Lentils": ("Nok", "Чечевица", "Lentils"),
    "Chickpeas": ("Toy noxak", "Нут", "Chickpeas"),
    "Spaghetti": ("Spageti", "Спагетти", "Spaghetti"),
    "Pizza Dough": ("Pizza xamiri", "Тесто для пиццы", "Pizza Dough"),
    "Burger Buns": ("Bulochka", "Булочки для бургера", "Burger Buns"),
    # Fruits
    "Lemon": ("Limon", "Лимон", "Lemon"),
    "Apple": ("Olma", "Яблоко", "Apple"),
    "Orange": ("Apelsin", "Апельсин", "Orange"),
    "Banana": ("Banan", "Банан", "Banana"),
    "Pomegranate": ("Anor", "Гранат", "Pomegranate"),
    "Grapes": ("Uzum", "Виноград", "Grapes"),
    "Dried Apricots": ("Quritilgan aprikos", "Курага", "Dried Apricots"),
    "Raisins": ("Mayiz", "Изюм", "Raisins"),
    "Dates": ("Xurmo", "Финики", "Dates"),
    "Strawberries": ("Yoron", "Клубника", "Strawberries"),
    "Blueberries": ("Chernika", "Черника", "Blueberries"),
    "Avocado": ("Avokado", "Авокадо", "Avocado"),
    # Spices
    "Salt": ("Tuz", "Соль", "Salt"),
    "Black Pepper": ("Qora qalampir", "Чёрный перец", "Black Pepper"),
    "Vegetable Oil": ("O'simlik yog'i", "Растительное масло", "Vegetable Oil"),
    "Olive Oil": ("Zaytun moyi", "Оливковое масло", "Olive Oil"),
    "Sugar": ("Shakar", "Сахар", "Sugar"),
    "Paprika": ("Qalampir bo'lak", "Паприка", "Paprika"),
    "Turmeric": ("Kurkuma", "Куркума", "Turmeric"),
    "Ground Cumin": ("Yerga zira", "Молотый кумин", "Ground Cumin"),
    "Ground Coriander": ("Yerga koriander", "Молотый кориандр", "Ground Coriander"),
    "Cinnamon": ("Dolchin", "Корица", "Cinnamon"),
    "Ginger": ("Zanjabil", "Имбирь", "Ginger"),
    "Parsley": ("Petrushka", "Петрушка", "Parsley"),
    "Dill": ("Ukrop", "Укроп", "Dill"),
    "Cilantro": ("Koriander", "Кинза", "Cilantro"),
    "Mint": ("Yalpiz", "Мята", "Mint"),
    "Bay Leaf": ("Lavrgurgi", "Лавровый лист", "Bay Leaf"),
    "Vinegar": ("Sirke", "Уксус", "Vinegar"),
    "Soy Sauce": ("Soya sousi", "Соевый соус", "Soy Sauce"),
    "Tomato Paste": ("Tomat bo'yog'i", "Томатная паста", "Tomato Paste"),
    "Honey": ("Asal", "Мёд", "Honey"),
    "Oregano": ("Oregano", "Орегано", "Oregano"),
    "Rosemary": ("Rozmarin", "Розмарин", "Rosemary"),
    "Thyme": ("Rayhon", "Тимьян", "Thyme"),
    "Basil": ("Reyhan", "Базилик", "Basil"),
    "Cocoa Powder": ("Kakao kukuni", "Какао-порошок", "Cocoa Powder"),
    "Zira (Cumin Seeds)": ("Zira", "Зира", "Zira (Cumin Seeds)"),
    "Curry Powder": ("Kari tovoq", "Карри", "Curry Powder"),
    # Other
    "Chicken Broth": ("Tovuq sho'rmasi", "Куриный бульон", "Chicken Broth"),
    "Beef Broth": ("Mol sho'rmasi", "Говяжий бульон", "Beef Broth"),
    "Water": ("Suv", "Вода", "Water"),
    "Walnuts": ("Yong'oq", "Грецкие орехи", "Walnuts"),
    "Sesame Seeds": ("Kunjut", "Кунжут", "Sesame Seeds"),
    "Baking Powder": ("Achish sodasi", "Разрыхлитель", "Baking Powder"),
    "Vanilla Extract": ("Vanil ekstrakti", "Ванильный экстракт", "Vanilla Extract"),
    "Yeast": ("Xamir achitqisi", "Дрожжи", "Yeast"),
    "Heavy Cream": ("Qaymoq", "Густые сливки", "Heavy Cream"),
    "Tomato Sauce": ("Tomato sousi", "Томатный соус", "Tomato Sauce"),
    "Mayonnaise": ("Mayonez", "Майонез", "Mayonnaise"),
    "Ketchup": ("Ketchup", "Кетчуп", "Ketchup"),
    "Tahini": ("Kunjut pastasi", "Тахини", "Tahini"),
    "Espresso": ("Espresso", "Эспрессо", "Espresso"),
    "Coconut Milk": ("Kokos sut", "Кокосовое молоко", "Coconut Milk"),
    "Savoiardi Biscuits": ("Savoiardi pechenyesi", "Печенье Савоярди", "Savoiardi Biscuits"),
    "Red Wine": ("Qizil sharob", "Красное вино", "Red Wine"),
}

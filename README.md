# API ShopOnline

Перед запуском необходимо установить используемые сервером пакеты:

```
npm install
```

## Запуск сервера

Сервер запускается по адресу http://localhost:3000:

```
npm run start
```

## Обработка запросов

### GET /api/goods?search={search}&page={page}

Параметры запроса:

```
{
  search?: string,
  page?: number
}
```

Ответ:

```
{
  'goods': {
    id: string,
    title: string,
    price: number,
    description: string,
    category: string,
    discount: number,
    count: number,
    units: string,
    image?: string
  }[]
}
```

### POST /api/goods

Тело запроса:

```
{
  id: string,
  title: string,
  price: number,
  description: string,
  category: string,
  discount: number | false,
  count: number,
  units: string
}
```

### GET /api/goods/{id}

Параметры запроса:

```
{
  id: string
}
```

Ответ:

```
{
  id: string,
  title: string,
  price: number,
  description: string,
  category: string,
  discount: number,
  count: number,
  units: string,
  image?: string
}
```

### PATCH /api/goods/{id}

Параметры запроса:

```
{
  id: string
}
```

Тело запроса:

```
{
  title?: string,
  price?: number,
  description?: string,
  category?: string,
  discount?: number | false,
  count?: number,
  units?: string,
  image?: image/png | image/jpg
}
```

### DELETE /api/goods/{id}

Параметры запроса:

```
{
  id: string
}
```

### GET /api/goods/discount

Ответ:

```
{
  'goods': {
      id: string,
      title: string,
      price: number,
      description: string,
      category: string,
      discount: number,
      count: number,
      units: string,
      image?: string
  }[]
}
```

### GET /api/goods/categories/{category}

Параметры запроса:

```
{
  category: string
}
```

Ответ:

```
{
  id: string,
  title: string,
  price: number,
  description: string,
  category: string,
  discount: number,
  count: number,
  units: string,
  image?: string
}[]
```

### GET /api/categories

Ответ:

```
{
  string[]
}
```

### GET /api/total

Ответ:

```
{
  number
}
```

const express = require('express');
const app = express();
const port = 3000;

let products = [
  {id: 1, name: 'Ноутбук', price: 75000},
  {id: 2, name: 'Смартфон', price: 45000},
  {id: 3, name: 'Наушники', price: 5000},
  {id: 4, name: 'Клавиатура', price: 3500},
  {id: 5, name: 'Мышь', price: 1500}
];

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Главная страница магазина')
})

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`)
})

app.get('/products', (req, res) => {
  res.json(products)
})

app.get('/products/:id', (req, res) => {
  let product = products.find(p => p.id == req.params.id)
  res.json(product)
})

app.post('/products', (req, res) => {
  const { name, price } = req.body
  const newProduct = {
    id: Date.now(),
    name,
    price
  }
  products.push(newProduct)
  res.status(201).json(newProduct)
})

app.patch('/products/:id', (req, res) => {
  const product = products.find(p => p.id == req.params.id)
  const { name, price } = req.body
  if(name !== undefined) product.name = name
  if(price !== undefined) product.price  = price
  res.json(product)
})

app.delete('/products/:id', (req, res) => {
  products = products.filter(p => p.id != req.params.id)
  res.send(`Продукт с id = ${req.params.id} удален`)
})



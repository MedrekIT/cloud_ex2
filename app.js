const express = require('express')
// Używamy fetch do pobierania danych pogodowych
const fetch = require('node-fetch')
const path = require('path')
// Ładujemy zmienne środowiskowe z .env
require('dotenv').config()

// Inicjalizacja zmiennej serwera express
const app = express()
const PORT = process.env.PORT || 3000
const AUTHOR = 'Daniel Mędrek'

// Obsługa danych przesyłanych metodą POST
app.use(express.urlencoded({ extended: true }))
// Katalog public jako źródło plików statycznych
app.use(express.static(path.join(__dirname, 'public')))

// Ładowanie strony z pliku index.html przy żądaniu GET na główną ścieżkę
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Ładowanie strony z informacjami pogodowymi przy żądaniu POST na ścieżkę /weather
app.post('/weather', async (req, res) => {
  const city = req.body.city
  const country = req.body.country
  const apiKey = process.env.API_KEY

  // URL z informacjami pogodowymi w formacie JSON
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=${apiKey}&units=metric&lang=pl`

  try {
    // Asynchroniczne pobranie informacji o pogodzie
    const response = await fetch(url)
    const data = await response.json()
    if (data.cod !== 200) {
      return res.send(`<h2>Błąd: ${data.message}</h2>`)
    }

    // Wypisanie danych pogodowych
    res.send(`
      <h2>Pogoda dla: ${data.name}, ${data.sys.country}</h2>
      <p>Temperatura: ${data.main.temp} °C</p>
      <p>Wilgotność: ${data.main.humidity}%</p>
      <p>Warunki: ${data.weather[0].description}</p>
      <a href="/">Powrót</a>
    `)
  } catch (err) {
    res.send(`
      <h2>Wystąpił błąd przy pobieraniu pogody</h2>
      <a href="/">Powrót</a>
      `)
  }
})

// Informacja o starcie serwera
app.listen(PORT, () => {
  const now = new Date().toISOString()
  console.log(`[${now}] Autor: ${AUTHOR} | Serwer nasłuchuje na porcie ${PORT}`)
})

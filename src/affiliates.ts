// Affiliate links.
//
// Expedia's creator program issues a *generated* short link per target page
// rather than a tracking parameter we can append to any URL, so each
// destination has its own link, generated in the Expedia dashboard.
//
// Keyed by the package `destination` string. Anything missing falls back to a
// plain, untracked search so the button always works.

const EXPEDIA_HOTELS: Record<string, string> = {
  'Scottsdale, AZ':
    'https://expedia.com/affiliates/hotel-search-scottsdale.LAfpyLU',
  'Myrtle Beach, SC':
    'https://expedia.com/affiliates/hotel-search-myrtle-beach.E7vvFQ9',
  'Hilton Head Island, SC':
    'https://expedia.com/affiliates/hotel-search-hilton-head-island.2EMp7ND',
  'Las Vegas, NV':
    'https://expedia.com/affiliates/hotel-search-las-vegas-strip.6XrkZe6',
  'San Diego, CA':
    'https://expedia.com/affiliates/hotel-search-san-diego.lAzqOFb',
  'Boyne, MI':
    'https://expedia.com/affiliates/hotel-search-boyne-city.iifTU1f',
  'Orlando, FL':
    'https://expedia.com/affiliates/hotel-search-orlando.pD3xjl8',
}

const VRBO_RENTALS: Record<string, string> = {
  'Scottsdale, AZ': 'https://vrbo.com/affiliate/5tKgXZT',
  'Myrtle Beach, SC': 'https://vrbo.com/affiliate/h5vpEvS',
  'Hilton Head Island, SC': 'https://vrbo.com/affiliate/guXYLzf',
  'Las Vegas, NV': 'https://vrbo.com/affiliate/nVqlVrU',
  'San Diego, CA': 'https://vrbo.com/affiliate/IiEZsBJ',
  'Boyne, MI': 'https://vrbo.com/affiliate/Jm6cE2Y',
  'Orlando, FL': 'https://vrbo.com/affiliate/smTqrsr',
}

const EXPEDIA_CARS: Record<string, string> = {
  'Scottsdale, AZ': 'https://expedia.com/affiliate/dkU2U4z',
  'Myrtle Beach, SC': 'https://expedia.com/affiliate/n8ivdtO',
  'Hilton Head Island, SC': 'https://expedia.com/affiliate/EnmaERX',
  'Las Vegas, NV': 'https://expedia.com/affiliate/C41QLLJ',
  'San Diego, CA': 'https://expedia.com/affiliate/GXsShSY',
  'Boyne, MI': 'https://expedia.com/affiliate/F8S3mVu',
  'Orlando, FL': 'https://expedia.com/affiliate/hDEsGna',
}

const EXPEDIA_FLIGHTS: Record<string, string> = {
  'Scottsdale, AZ': 'https://expedia.com/affiliate/zcA5nil',
  'Myrtle Beach, SC': 'https://expedia.com/affiliate/tCNPvBm',
  'Hilton Head Island, SC': 'https://expedia.com/affiliate/UwiSJqX',
  'Las Vegas, NV': 'https://expedia.com/affiliate/HWodFNC',
  'San Diego, CA': 'https://expedia.com/affiliates/expedia-home.MDOK8io',
  'Boyne, MI': 'https://expedia.com/affiliates/expedia-home.Ee7d71Y',
  'Orlando, FL': 'https://expedia.com/affiliates/expedia-home.5SU7M4s',
}

const enc = (s: string) => encodeURIComponent(s || '')

export function hotelsLink(destination: string): string {
  return (
    EXPEDIA_HOTELS[destination] ||
    `https://www.expedia.com/Hotel-Search?destination=${enc(destination)}`
  )
}

export function rentalsLink(destination: string): string {
  return (
    VRBO_RENTALS[destination] ||
    `https://www.vrbo.com/search?q=${enc(destination)}`
  )
}

export function carsLink(destination: string): string {
  return EXPEDIA_CARS[destination] || 'https://www.expedia.com/Carrentals'
}

export function flightsLink(destination: string): string {
  return (
    EXPEDIA_FLIGHTS[destination] ||
    `https://www.expedia.com/Flights-Search?leg1=to:${enc(destination)}`
  )
}

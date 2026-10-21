import * as Location from 'expo-location'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { nearestPlaceLabel, searchPlaces, type Place } from '@shared/nearby'
import { Button, Card, Hint, Serif } from '@/components/ui'
import { colors, fonts } from '@/theme'

/**
 * "Find trips near you" — type a town/state (or a ZIP, via Apple's geocoder)
 * or use the phone's location; the chosen point sorts trips by distance.
 */
export default function NearbySearch({
  value,
  onChange,
}: {
  value: Place | null
  onChange: (p: Place | null) => void
}) {
  const [text, setText] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const seq = useRef(0)

  useEffect(() => {
    const q = text.trim()
    const mine = ++seq.current
    if (q.length < 2) return
    const t = setTimeout(() => {
      searchPlaces(q, 5).then((r) => {
        if (mine === seq.current) setResults(r)
      })
    }, 120)
    return () => clearTimeout(t)
  }, [text])

  function pick(p: Place) {
    onChange(p)
    setText('')
    setResults([])
    setError('')
  }

  async function submit() {
    const q = text.trim()
    if (!q) return
    const r = shown.length ? shown : await searchPlaces(q, 1)
    if (r[0]) return pick(r[0])
    // not in our town list (e.g. a ZIP code or small town): ask Apple's geocoder
    setBusy(true)
    try {
      const [hit] = await Location.geocodeAsync(q)
      if (hit) {
        const p = { lat: hit.latitude, lon: hit.longitude }
        const near = await nearestPlaceLabel(p)
        return pick({ ...p, label: near === 'your location' ? q : near })
      }
      setError(`Couldn't find “${q}”. Try a city and state, like “Kent, OH”.`)
    } catch {
      setError(`Couldn't find “${q}”. Try a city and state, like “Kent, OH”.`)
    } finally {
      setBusy(false)
    }
  }

  async function useMyLocation() {
    setBusy(true)
    setError('')
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setError('Location is off for Flagstick Finder — type your city instead, or allow it in Settings.')
        return
      }
      const pos =
        (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }))
      const p = { lat: pos.coords.latitude, lon: pos.coords.longitude }
      pick({ ...p, label: await nearestPlaceLabel(p) })
    } catch {
      setError('Couldn’t get your location — type your city instead.')
    } finally {
      setBusy(false)
    }
  }

  // short queries show nothing (stale results from a longer query are hidden)
  const shown = text.trim().length >= 2 ? results : []

  if (value) {
    return (
      <Card style={st.setRow}>
        <Text style={{ fontSize: 22 }}>📍</Text>
        <View style={{ flex: 1 }}>
          <Text style={st.kicker}>CLOSEST TRIPS TO</Text>
          <Text style={st.place}>{value.label}</Text>
        </View>
        <Button title="Change" small variant="subtle" onPress={() => onChange(null)} />
      </Card>
    )
  }

  return (
    <Card>
      <Serif style={{ fontSize: 24 }}>Find trips near you</Serif>
      <Hint style={{ marginBottom: 10 }}>Enter your city or where you want to play — we&apos;ll sort trips by distance.</Hint>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t)
            setError('')
          }}
          onSubmitEditing={submit}
          placeholder="e.g. Kent, OH or 44240"
          placeholderTextColor="#9aa59d"
          returnKeyType="search"
          autoCorrect={false}
          style={st.input}
        />
        <Button title="Search" small onPress={submit} style={{ minHeight: 46 }} />
      </View>

      {shown.length > 0 && (
        <View style={st.results}>
          {shown.map((r, i) => (
            <Pressable
              key={r.label}
              onPress={() => pick(r)}
              style={({ pressed }) => [st.result, i > 0 && st.resultLine, pressed && { backgroundColor: colors.green100 }]}
            >
              <Text style={st.resultText}>{r.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable onPress={useMyLocation} disabled={busy} style={st.locate} hitSlop={6} accessibilityRole="button">
        {busy ? <ActivityIndicator color={colors.green600} /> : <Text style={st.locateText}>📍 Use my location</Text>}
      </Pressable>
      {error ? <Text style={st.error}>{error}</Text> : null}
    </Card>
  )
}

const st = StyleSheet.create({
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kicker: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1, color: colors.muted },
  place: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
  },
  results: { marginTop: 6, borderWidth: 1, borderColor: colors.line, borderRadius: 12, overflow: 'hidden' },
  result: { paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#fff' },
  resultLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  resultText: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  locate: { marginTop: 12, alignSelf: 'flex-start', minHeight: 24, justifyContent: 'center' },
  locateText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.green600 },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginTop: 8 },
})

import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import {
  carsLink,
  featuredStay,
  flightsLink,
  golfNowAreaLink,
  hotelsLink,
  moreCourses,
  rentalsLink,
  stayPhotos,
} from '@shared/affiliates'
import { getPackage } from '@shared/packages'
import { getRestaurants, mapsLink, reserveLink } from '@shared/restaurants'
import { useStore } from '@shared/store'
import { BookCourse, BookLink, BookRow, CourseLink, CourseLinks } from '@/components/BookLinks'
import { Field, Input } from '@/components/Field'
import Screen from '@/components/Screen'
import StayGallery from '@/components/StayGallery'
import { Button, Card, Hint, PageTitle, SectionTitle, Serif, T } from '@/components/ui'
import { openLink } from '@/lib/links'
import { colors, fonts, radius, shadow } from '@/theme'


export default function Booking() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>()
  const trip = useStore((s) => s.getTrip(tripId))
  const [hotel, setHotel] = useState('')
  const { width } = useWindowDimensions()

  if (!trip) {
    return (
      <Screen>
        <Card style={{ alignItems: 'center', gap: 12 }}>
          <T>That trip doesn&apos;t exist.</T>
          <Button title="Back to trips" variant="subtle" small onPress={() => router.replace('/trips')} />
        </Card>
      </Screen>
    )
  }

  const pkg = trip.sourcePackageId ? getPackage(trip.sourcePackageId) : undefined
  const restaurants = getRestaurants(trip.destination)
  const stay = featuredStay(trip.destination)
  const more = moreCourses(trip.destination)
  const area = trip.destination ? trip.destination.split(',')[0] : 'the area'
  // Gallery photos for the featured stay, hero first. Falls back to the
  // trip's golf photo if we have no stay photos.
  const photos = stayPhotos(trip.destination)
  const gallery = photos.length ? photos : pkg?.image ? [pkg.image] : []

  // Tee-time links: the package's courses (their own site + GolfNow),
  // otherwise the courses typed into the trip (GolfNow search fallback).
  const teeLinks: { name: string; website?: string; golfNow?: string }[] = pkg
    ? pkg.courses
    : trip.courses.map((c) => ({ name: c.name }))

  const hotelTrim = hotel.trim()

  return (
    <Screen>
      <PageTitle
        sub={`${trip.name}${trip.destination ? ` · ${trip.destination}` : ''} — book your stay, travel, and tee times, then head to the scorecard.`}
      >
        Book your trip
      </PageTitle>

      <SectionTitle style={{ marginTop: 4 }}>Stay</SectionTitle>
      {stay && gallery.length > 0 && (
        <View style={st.stayCard}>
          <StayGallery photos={gallery} width={width - 32} />
          <View style={st.stayBody}>
            <Serif style={st.stayName}>One place for the whole crew</Serif>
            <T style={st.stayDesc}>
              {stay.desc} Central to the trip&apos;s courses, so everyone stays under one roof.
            </T>
            <Pressable
              accessibilityRole="link"
              onPress={() => openLink(stay.url)}
              style={({ pressed }) => [st.stayCta, pressed && { opacity: 0.8 }]}
            >
              <Text style={st.stayCtaText}>View on Vrbo ↗</Text>
            </Pressable>
          </View>
        </View>
      )}
      <View style={{ marginTop: stay ? 10 : 0 }}>
        <BookRow>
          <BookLink title="🏠 More rentals on Vrbo ↗" url={rentalsLink(trip.destination)} />
          <BookLink title="🏨 Hotels on Expedia ↗" url={hotelsLink(trip.destination)} />
        </BookRow>
      </View>
      <Hint style={{ marginTop: 8, marginHorizontal: 4 }}>
        Searches {trip.destination || 'the destination'} for more places to stay.
      </Hint>

      <SectionTitle>Travel</SectionTitle>
      <BookRow>
        <BookLink title="✈️ Find flights on Expedia ↗" url={flightsLink(trip.destination)} />
        <BookLink title="🚗 Rental cars on Expedia ↗" url={carsLink(trip.destination)} />
      </BookRow>

      <SectionTitle>Tee times</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        {teeLinks.length === 0 ? (
          <T style={{ color: colors.muted, paddingVertical: 12 }}>No courses on this trip yet.</T>
        ) : (
          teeLinks.map((c, i) => (
            <BookCourse key={c.name} name={c.name} last={i === teeLinks.length - 1}>
              <CourseLinks course={c} area={trip.destination} />
            </BookCourse>
          ))
        )}
      </Card>

      {more.length > 0 && (
        <>
          <Hint style={{ marginTop: 12, marginBottom: 8, marginHorizontal: 4 }}>
            Can&apos;t get a time? More courses to play in {area}:
          </Hint>
          <Card style={{ paddingVertical: 4 }}>
            {more.map((c, i) => (
              <BookCourse key={c.name} name={c.name} last={i === more.length - 1}>
                <CourseLinks course={c} area={trip.destination} />
              </BookCourse>
            ))}
          </Card>
        </>
      )}
      <Pressable accessibilityRole="link" onPress={() => openLink(golfNowAreaLink(trip.destination))} hitSlop={6}>
        {({ pressed }) => (
          <Text style={[st.bookMore, pressed && { textDecorationLine: 'underline' }]}>
            Can&apos;t find a tee time? Browse every course in {area} on GolfNow ↗
          </Text>
        )}
      </Pressable>

      {restaurants.length > 0 && (
        <>
          <SectionTitle>Where to eat</SectionTitle>
          <Hint style={{ marginTop: -4, marginBottom: 10, marginHorizontal: 4 }}>
            Highly-rated spots near the courses — a nice night out or a casual post-round bite.
          </Hint>
          <View style={{ gap: 12 }}>
            {restaurants.map((r) => (
              <View key={r.name} style={st.dining}>
                <View style={st.diningTop}>
                  <Text style={st.diningName}>{r.name}</Text>
                  <Text style={st.diningRating}>★ {r.rating}</Text>
                </View>
                <View style={st.diningSub}>
                  <Text style={[st.diningSubText, st.diningPrice]}>{r.price}</Text>
                  <Text style={[st.diningSubText, { opacity: 0.5 }]}>·</Text>
                  <Text style={st.diningSubText}>{r.cuisine}</Text>
                  <Text style={[st.diningSubText, { opacity: 0.5 }]}>·</Text>
                  <Text style={st.diningSubText}>{r.area}</Text>
                </View>
                <T style={st.diningNote}>{r.note}</T>
                <View style={st.diningLinks}>
                  <CourseLink title="Reserve on OpenTable ↗" url={reserveLink(r, trip.destination)} gold />
                  <CourseLink title="Map ↗" url={mapsLink(r, trip.destination)} />
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      <SectionTitle>Drive times</SectionTitle>
      <Card>
        <Field label="Your hotel or rental">
          <Input
            value={hotel}
            onChangeText={setHotel}
            placeholder="Type your hotel or resort name"
            autoCorrect={false}
            returnKeyType="done"
          />
        </Field>
        {teeLinks.length === 0 ? (
          <T style={{ color: colors.muted }}>Add courses to the trip to check drive times.</T>
        ) : (
          teeLinks.map((c, i) => {
            const destPlace = encodeURIComponent(`${c.name}, ${trip.destination || ''}`)
            const href = hotelTrim
              ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(hotel)}&destination=${destPlace}`
              : `https://www.google.com/maps/search/?api=1&query=${destPlace}`
            return (
              <BookCourse key={c.name} name={c.name} last={i === teeLinks.length - 1}>
                <CourseLink title={hotelTrim ? 'Directions ↗' : 'Map ↗'} url={href} />
              </BookCourse>
            )
          })
        )}
        <Hint style={{ marginTop: 8, marginHorizontal: 4 }}>
          Opens Google Maps with live traffic time from your place to each course.
        </Hint>
      </Card>

      <Button
        title="Continue to trip setup →"
        variant="gold"
        style={{ marginTop: 20 }}
        onPress={() => router.replace({ pathname: '/trip/[tripId]/setup', params: { tripId } })}
      />
    </Screen>
  )
}

const st = StyleSheet.create({
  stayCard: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius,
    overflow: 'hidden',
    ...shadow,
  },
  stayBody: { paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16 },
  stayName: { fontFamily: fonts.serifBold, fontSize: 22, color: colors.ink, marginBottom: 4 },
  stayDesc: { fontSize: 13, lineHeight: 19.5, color: colors.muted, marginBottom: 12 },
  stayCta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  stayCtaText: { fontFamily: fonts.sansBold, fontSize: 13, letterSpacing: 0.3, color: '#3a2e07' },
  bookMore: {
    marginTop: 10,
    marginHorizontal: 4,
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: colors.goldDark,
  },
  dining: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    ...shadow,
  },
  diningTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  diningName: { flex: 1, fontFamily: fonts.sansBold, fontSize: 19, lineHeight: 22, color: colors.green900 },
  diningRating: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.goldDark },
  diningSub: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginTop: 5 },
  diningSubText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted },
  diningPrice: { fontFamily: fonts.sansBold, color: colors.green700 },
  diningNote: { fontSize: 13.5, lineHeight: 19.5, marginTop: 10, marginBottom: 12 },
  diningLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
})

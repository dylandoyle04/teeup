import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { openLink } from '@/lib/links'
import { colors, fonts } from '@/theme'

/** Big gold-outlined partner link (the web app's `.book-link`). */
export function BookLink({ title, url }: { title: string; url: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => openLink(url)}
      style={({ pressed }) => [st.bookLink, pressed && { backgroundColor: '#fffdf3', transform: [{ scale: 0.98 }] }]}
    >
      <Text style={st.bookLinkText}>{title}</Text>
    </Pressable>
  )
}

export function BookRow({ children }: { children: ReactNode }) {
  return <View style={st.bookRow}>{children}</View>
}

/** Small pill link (the web app's `.course-link`; `gold` = `.course-link.gn`). */
export function CourseLink({ title, url, gold }: { title: string; url: string; gold?: boolean }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => openLink(url)}
      hitSlop={4}
      style={({ pressed }) => [st.courseLink, gold && st.courseLinkGold, pressed && { opacity: 0.75 }]}
    >
      <Text style={[st.courseLinkText, gold && { color: colors.goldDark }]}>{title}</Text>
    </Pressable>
  )
}

/** One course row inside a card: name on the left, action on the right. */
export function BookCourse({ name, last, children }: { name: string; last?: boolean; children: ReactNode }) {
  return (
    <View style={[st.course, last && { borderBottomWidth: 0 }]}>
      <Text style={st.courseName}>⛳ {name}</Text>
      {children}
    </View>
  )
}

const st = StyleSheet.create({
  bookRow: { gap: 12 },
  bookLink: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookLinkText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.goldDark },
  courseLink: {
    backgroundColor: colors.green100,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  courseLinkGold: { backgroundColor: '#f6ecc9' },
  courseLinkText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.green700 },
  course: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  courseName: { flex: 1, fontFamily: fonts.sansBold, fontSize: 15, color: colors.green900 },
})

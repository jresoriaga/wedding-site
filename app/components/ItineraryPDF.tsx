'use client'
// [AC-AITINPDF-F3, F5, F6]
// Dynamically imported via useItineraryDownload — never statically imported in server components
// @react-pdf/renderer uses browser canvas APIs; must be loaded client-side only
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { GeneratedItinerary, TripConfig, ItineraryItem } from '@/app/lib/types'

interface Props {
  itinerary: GeneratedItinerary
  tripConfig: TripConfig
}

// [SOLID:SRP] — styles separated from rendering logic
const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#f8fafc' },
  header: { 
    marginBottom: 32, 
    alignItems: 'center', 
    borderBottomWidth: 2, 
    borderBottomColor: '#bae6fd', 
    paddingBottom: 20 
  },
  tripName: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#0f172a', 
    marginBottom: 8, 
    textTransform: 'uppercase', 
    letterSpacing: 2 
  },
  subtitle: { fontSize: 12, color: '#475569', marginBottom: 4 },
  stayDetail: { 
    fontSize: 12, 
    color: '#0369a1', 
    fontWeight: 'bold', 
    marginTop: 6,
    backgroundColor: '#e0f2fe',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  dayCard: { 
    marginBottom: 28, 
    backgroundColor: '#ffffff', 
    borderRadius: 8, 
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dayHeader: { 
    backgroundColor: '#0284c7', 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderTopLeftRadius: 7, 
    borderTopRightRadius: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dayTitleContainer: {
    flexDirection: 'column'
  },
  dayTitle: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#ffffff', 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  dayDate: { 
    fontSize: 11, 
    color: '#e0f2fe', 
    marginTop: 2 
  },
  mealContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9' 
  },
  mealContainerLast: {
    borderBottomWidth: 0
  },
  timeColumn: { 
    width: '25%', 
    borderRightWidth: 2, 
    borderRightColor: '#f1f5f9', 
    paddingRight: 16 
  },
  mealType: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    color: '#0284c7', 
    textTransform: 'uppercase', 
    marginBottom: 6,
    letterSpacing: 0.5
  },
  timeText: { fontSize: 11, color: '#334155', fontWeight: 'bold' },
  durationText: { fontSize: 9, color: '#94a3b8', marginTop: 4 },
  detailsColumn: { 
    width: '75%', 
    paddingLeft: 16, 
    justifyContent: 'center' 
  },
  venueName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 6 },
  venueNoVote: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', marginBottom: 4 },
  venueAddress: { fontSize: 10, color: '#64748b', marginBottom: 6, lineHeight: 1.4 },
  travelBox: { 
    backgroundColor: '#f8fafc', 
    paddingVertical: 6,
    paddingHorizontal: 8, 
    borderRadius: 4, 
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#cbd5e1'
  },
  travelNote: { fontSize: 10, color: '#475569', fontStyle: 'italic' },
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12 },
  footerText: { fontSize: 9, color: '#94a3b8', textAlign: 'center', fontWeight: 'bold', letterSpacing: 0.5 },
})

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function TimelineItem({ item, isLast }: { item: ItineraryItem; isLast?: boolean }) {
  const hasContent = item.name !== 'No votes yet' && item.name !== 'No activity selected'
  const isActivity = item.type === 'activity'
  const typeEmoji = isActivity ? '🎯' : '🍽️'
  return (
    <View style={isLast ? [s.mealContainer, s.mealContainerLast] : s.mealContainer}>
      {/* Time Column */}
      <View style={s.timeColumn}>
        <Text style={[s.mealType, isActivity ? { color: '#7c3aed' } : {}]}>
          {typeEmoji} {item.label}
        </Text>
        {hasContent && item.startTime !== '—' && (
          <Text style={s.timeText}>{item.startTime}</Text>
        )}
        {hasContent && item.duration && (
          <Text style={s.durationText}>{item.duration}</Text>
        )}
        {hasContent && item.distanceFromPrev !== '—' && (
          <Text style={s.durationText}>📍 {item.distanceFromPrev}</Text>
        )}
      </View>

      {/* Details Column */}
      <View style={s.detailsColumn}>
        <Text style={hasContent ? s.venueName : s.venueNoVote}>{item.name}</Text>
        {hasContent && item.address && (
          <Text style={s.venueAddress}>{item.address}</Text>
        )}
        {hasContent && item.travelNote && item.travelNote !== '—' && (
          <View style={s.travelBox}>
            <Text style={s.travelNote}>🚗 {item.travelNote}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default function ItineraryPDF({ itinerary, tripConfig }: Props) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* [AC-AITINPDF-F6] Header */}
        <View style={s.header}>
          <Text style={s.tripName}>{tripConfig.trip_name}</Text>
          <Text style={s.subtitle}>
            {formatDate(tripConfig.start_date)} – {formatDate(tripConfig.end_date)}
          </Text>
          <Text style={s.stayDetail}>🏠 Stay: {tripConfig.stay_name}</Text>
        </View>

        {/* [AC-AITINPDF-F3, F5] Days */}
        {itinerary.days.map((day) => (
          <View key={day.day} style={s.dayCard} wrap={false}>
            <View style={s.dayHeader}>
              <View style={s.dayTitleContainer}>
                <Text style={s.dayTitle}>Day {day.day}</Text>
                <Text style={s.dayDate}>{formatDate(day.date)}</Text>
              </View>
            </View>
            
            <View>
              {day.items.map((item, i) => (
                <TimelineItem 
                  key={`${item.label}-${i}`} 
                  item={item} 
                  isLast={i === day.items.length - 1} 
                />
              ))}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Generated by La Union Outing Planner • {new Date().toLocaleDateString('en-PH')}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

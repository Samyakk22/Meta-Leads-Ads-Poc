import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

const MAIN_FIELDS = new Set([
  'full_name',
  'name',
  'first_name',
  'last_name',
  'email',
  'work_email',
  'phone_number',
  'phone',
  'work_phone_number',
]);

function formatTime(iso) {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const labelFor = (fieldName) => fieldName.replace(/_/g, ' ');
function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, !value && styles.missing]} selectable>
        {value || 'Not provided'}
      </Text>
    </View>
  );
}

export default function LeadCard({ lead, isNew }) {
  const glow = useRef(new Animated.Value(isNew ? 1 : 0)).current;

  useEffect(() => {
    if (!isNew) return;
    glow.setValue(1);
    Animated.timing(glow, {
      toValue: 0,
      duration: 5000,
      useNativeDriver: false,
    }).start();
  }, [isNew, glow]);

  const backgroundColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffffff', '#dcfce7'],
  });
  const extraFields = Object.entries(lead.fields || {}).filter(
    ([name]) => !MAIN_FIELDS.has(name)
  );

  return (
    <Animated.View style={[styles.card, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.name, !lead.name && styles.missing]} numberOfLines={1}>
          {lead.name || 'Name not provided'}
        </Text>
        {isNew ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>NEW</Text>
          </View>
        ) : null}
      </View>

      <Row label="Email" value={lead.email} />
      <Row label="Phone" value={lead.phone} />
      {extraFields.map(([name, value]) => (
        <Row key={name} label={labelFor(name)} value={value} />
      ))}

      <Text style={styles.meta}>
        Lead {lead.id}
        {formatTime(lead.receivedAt) ? ` · received ${formatTime(lead.receivedAt)}` : ''}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#16a34a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 72,
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  missing: {
    color: '#9ca3af',
    fontStyle: 'italic',
    fontWeight: '400',
  },
  meta: {
    marginTop: 8,
    fontSize: 12,
    color: '#9ca3af',
  },
});

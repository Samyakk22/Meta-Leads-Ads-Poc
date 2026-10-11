import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BACKEND_URL } from './config';
import LeadCard from './LeadCard';
import { useLeads } from './useLeads';

const STATUS = {
  connected: { text: 'Live', color: '#16a34a' },
  connecting: { text: 'Connecting…', color: '#d97706' },
  reconnecting: { text: 'Reconnecting…', color: '#dc2626' },
};

function Message({ title, body, spinner }) {
  return (
    <View style={styles.message}>
      {spinner ? <ActivityIndicator size="large" color="#2563eb" style={styles.spinner} /> : null}
      <Text style={styles.messageTitle}>{title}</Text>
      {body ? <Text style={styles.messageBody}>{body}</Text> : null}
    </View>
  );
}

export default function LeadsScreen() {
  const { leads, status, loaded, newIds } = useLeads();
  const indicator = STATUS[status];

  let content;
  if (!BACKEND_URL) {
    content = (
      <Message
        title="Backend URL not configured"
        body="Set EXPO_PUBLIC_BACKEND_URL in mobile/.env and restart Expo."
      />
    );
  } else if (!loaded) {
    content = (
      <Message
        spinner
        title="Connecting to the backend…"
        body={`${BACKEND_URL}\nIf this does not go away, check that the backend is running and reachable from this device.`}
      />
    );
  } else {
    content = (
      <FlatList
        data={leads}
        keyExtractor={(lead) => lead.id}
        renderItem={({ item }) => <LeadCard lead={item} isNew={newIds.has(item.id)} />}
        extraData={newIds}
        contentContainerStyle={leads.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <Message
            title="No leads yet"
            body="Submit a test lead in Meta's Lead Ads Testing Tool. It will appear here on its own."
          />
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Live Meta Leads</Text>
          <Text style={styles.subtitle}>
            {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
          </Text>
        </View>
        {BACKEND_URL ? (
          <View style={styles.status}>
            <View style={[styles.dot, { backgroundColor: indicator.color }]} />
            <Text style={[styles.statusText, { color: indicator.color }]}>{indicator.text}</Text>
          </View>
        ) : null}
      </View>

      {loaded && status !== 'connected' ? (
        <Text style={styles.banner}>
          Connection lost. Trying to reconnect; leads received meanwhile will appear once
          it is back.
        </Text>
      ) : null}

      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#6b7280',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  banner: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    fontSize: 13,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  message: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  spinner: {
    marginBottom: 16,
  },
  messageTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  messageBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
    textAlign: 'center',
  },
});

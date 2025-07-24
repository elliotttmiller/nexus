import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PRIMARY } from '../constants/colors';

interface ExpandableSectionProps<T> {
  data: T[];
  initialCount: number;
  title: string;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export default function ExpandableSection<T extends { id?: string }>({ data, initialCount, title, renderItem }: ExpandableSectionProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const itemsToShow = expanded ? data : data.slice(0, initialCount);

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {itemsToShow.map((item, i) => (
        <React.Fragment key={item.id || i}>
          {renderItem(item, i)}
        </React.Fragment>
      ))}
      {data.length > initialCount && (
        <TouchableOpacity
          style={styles.greenButton}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            {expanded ? 'Show Less' : `View More (${data.length - initialCount})`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
  greenButton: {
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
}); 
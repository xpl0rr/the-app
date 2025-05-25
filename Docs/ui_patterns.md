# Finance UI Patterns and Styles

This document captures the UI patterns, components, and styles used in the Finance page of the Joi2049 app. Use this as a reference when implementing similar UI in other projects.

## Card-Based Layout

- Rounded, light gray (`#F5F5F5`) background cards with consistent padding (16px) 
- White or blue accent elements for interactive components
- Consistent border radius (16px) across all container elements

```jsx
// Example of a card container
<View style={styles.card}>
  <Text style={styles.cardTitle}>Bills</Text>
  {/* Card content */}
</View>
```

## Typography Patterns

- Clean black text on light backgrounds for maximum readability
- Consistent font sizes: 18px for headings, 12px for labels
- Bold text for emphasis on important values and current selection

```jsx
// Example of typography usage
<Text style={styles.headerText}>Finance</Text>
<Text style={styles.totalTitle}>Spent this month: ${totalSpending.toFixed(2)}</Text>
```

## Custom Chart Implementation

The chart uses a combination of react-native-chart-kit for the actual graph and custom components for the labels:

```jsx
// Custom Y-axis with dynamic reference points
<View style={styles.yAxis}>
  <View style={styles.yAxisValueContainer}>
    <Text style={styles.yAxisLabel}>${Math.round(totalSpending)}</Text>
  </View>
  <View style={styles.yAxisValueContainer}>
    <Text style={styles.yAxisLabel}>${Math.round(totalSpending * 0.75)}</Text>
  </View>
  <View style={styles.yAxisValueContainer}>
    <Text style={styles.yAxisLabel}>${Math.round(totalSpending * 0.5)}</Text>
  </View>
  <View style={styles.yAxisValueContainer}>
    <Text style={styles.yAxisLabel}>${Math.round(totalSpending * 0.25)}</Text>
  </View>
  <View style={styles.yAxisValueContainer}>
    <Text style={styles.yAxisLabel}>$0</Text>
  </View>
</View>

// LineChart with custom configurations
<LineChart
  fromZero
  data={{
    labels: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    datasets: [
      {
        data: [
          currentMonth === 0 ? totalSpending : 0,
          // ...other months
        ]
      }
    ]
  }}
  width={Dimensions.get('window').width - 80}
  height={150}
  chartConfig={{
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: () => '#4D82F3',
    labelColor: () => 'rgba(0,0,0,0)', // Hide chart's own labels
    strokeWidth: 2,
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#FFFFFF'
    }
  }}
  bezier
  withInnerLines={false}
  withOuterLines={true}
  withVerticalLines={false}
  withHorizontalLines={true}
  segments={4}
  hidePointsAtIndex={Array.from({ length: 12 }, (_, i) => i !== currentMonth ? i : -1).filter(i => i !== -1)}
/>
```

## StyleSheet Reference

```javascript
const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
  },
  
  // Section header
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  
  // Card containers
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  
  // Total container
  totalContainer: {
    marginTop: 'auto',
    marginBottom: 10,
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  totalTitle: {
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
  },
  
  // Chart components
  chartContainer: {
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  chartWithLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  yAxis: {
    height: 150,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingRight: 10,
    width: 60,
  },
  yAxisValueContainer: {
    width: 60,
  },
  yAxisLabel: {
    fontSize: 12,
    color: '#000000',
    fontWeight: 'bold',
  },
  chartMainArea: {
    flex: 1,
  },
  monthsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingLeft: 60,
    paddingRight: 20,
    marginTop: -25,
  },
  monthLabel: {
    fontSize: 12,
    color: '#000000',
    textAlign: 'center',
  },
  currentMonth: {
    fontWeight: 'bold',
    color: '#4D82F3',
  },
  
  // Add buttons
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4D82F3',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 16,
    top: 16,
  },
  
  // Row styles
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  
  // Input styles
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  
  // Modal styles
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#4D82F3',
  },
  secondaryButton: {
    backgroundColor: '#EEEEEE',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#000000',
  },
});
```

## Color Palette

- Background: White (`#FFFFFF`)
- Card Background: Light Gray (`#F5F5F5`)
- Primary Accent: Blue (`#4D82F3`)
- Text: Black (`#000000`)
- Secondary Text: Gray (`#AAAAAA`)
- Border/Divider: Light Gray (`#EEEEEE`)
- Input Border: Lighter Gray (`#DDDDDD`)

## Interactive Elements

- Blue (`#4D82F3`) circular buttons for add actions
- Toggle switches for enabling/disabling features
- Modal dialogs for editing and adding items
- Clean, minimal forms with proper spacing

## Implementation Notes

1. Always use consistent spacing (margins and padding)
2. Keep text sizes consistent across the app
3. Ensure proper contrast between text and backgrounds
4. Use the same border radius (16px) for container elements
5. Smaller radius (8px) for input fields and buttons

This document should serve as a reference for implementing consistent UI across different projects.

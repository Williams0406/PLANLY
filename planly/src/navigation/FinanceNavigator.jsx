import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FinancePlansScreen from '../screens/finance/FinancePlansScreen';
import FinancePlanOverviewScreen from '../screens/finance/FinancePlanOverviewScreen';
import FinanceCreateMovementScreen from '../screens/finance/FinanceCreateMovementScreen';
import FinancePlanSummaryScreen from '../screens/finance/FinancePlanSummaryScreen';

const Stack = createNativeStackNavigator();

export default function FinanceNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FinancePlans" component={FinancePlansScreen} />
      <Stack.Screen name="FinancePlanOverview" component={FinancePlanOverviewScreen} />
      <Stack.Screen name="FinanceCreateMovement" component={FinanceCreateMovementScreen} />
      <Stack.Screen name="FinancePlanSummary" component={FinancePlanSummaryScreen} />
    </Stack.Navigator>
  );
}
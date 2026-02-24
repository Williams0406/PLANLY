// src/navigation/PlanStackNavigator.js

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import PlanOverviewScreen from "../screens/plan/PlanOverviewScreen";
import CreatePlanStepOne from "../screens/plan/CreatePlanStepOne";
import CreatePlanStepTwo from "../screens/plan/CreatePlanStepTwo";

const Stack = createNativeStackNavigator();

export default function PlanStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PlanOverview" component={PlanOverviewScreen} />
      <Stack.Screen name="CreatePlanStepOne" component={CreatePlanStepOne} />
      <Stack.Screen name="CreatePlanStepTwo" component={CreatePlanStepTwo} />
    </Stack.Navigator>
  );
}
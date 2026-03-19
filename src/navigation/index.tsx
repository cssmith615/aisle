import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../theme';

// Auth screens
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';

// Onboarding screens
import OnboardingWelcomeScreen from '../screens/onboarding/OnboardingWelcomeScreen';
import OnboardingEventDateScreen from '../screens/onboarding/OnboardingEventDateScreen';
import OnboardingEventScaleScreen from '../screens/onboarding/OnboardingEventScaleScreen';
import OnboardingGeneratingScreen from '../screens/onboarding/OnboardingGeneratingScreen';

// Main screens
import DashboardScreen from '../screens/main/DashboardScreen';
import ChecklistScreen from '../screens/main/ChecklistScreen';
import BudgetScreen from '../screens/main/BudgetScreen';
import VendorsScreen from '../screens/main/VendorsScreen';
import GuestListScreen from '../screens/main/GuestListScreen';
import AIAssistantScreen from '../screens/main/AIAssistantScreen';

// Placeholder — screens will be replaced sprint by sprint
const PlaceholderScreen = ({ name }: { name: string }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
    <Text style={{ color: Colors.textSecondary, fontSize: 16 }}>{name}</Text>
  </View>
);

// ─── Stack param lists ───────────────────────────────────────────────────────

export type AuthStackParams = {
  SignIn: undefined;
  SignUp: undefined;
};

export type OnboardingStackParams = {
  OnboardingWelcome: undefined;
  OnboardingEventType: undefined;
  OnboardingEventDate: { eventType: string };
  OnboardingEventScale: { eventType: string; eventDate?: string; eventName: string };
  OnboardingGenerating: { eventType: string; eventDate?: string; eventName: string; guestCount?: number; budget?: number };
};

export type MainTabParams = {
  Dashboard: undefined;
  Plan: undefined;
  Budget: undefined;
  Vendors: undefined;
};

export type MainStackParams = {
  MainTabs: undefined;
  ChecklistItemDetail: { itemId: string };
  AddExpense: { eventId: string; vendorId?: string };
  BudgetCategoryDetail: { category: string; eventId: string };
  VendorDetail: { vendorId: string };
  AddEditVendor: { vendorId?: string; eventId: string };
  GuestList: undefined;
  AddEditGuest: { guestId?: string; eventId: string };
  AIAssistant: undefined;
  EventSettings: { eventId: string };
  Profile: undefined;
  Notifications: undefined;
  Upgrade: undefined;
};

// ─── Navigators ──────────────────────────────────────────────────────────────

const AuthStack = createNativeStackNavigator<AuthStackParams>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParams>();
const MainTab = createBottomTabNavigator<MainTabParams>();
const MainStack = createNativeStackNavigator<MainStackParams>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
      <OnboardingStack.Screen name="OnboardingEventType" children={() => <PlaceholderScreen name="Event Type" />} />
      <OnboardingStack.Screen name="OnboardingEventDate" component={OnboardingEventDateScreen} />
      <OnboardingStack.Screen name="OnboardingEventScale" component={OnboardingEventScaleScreen} />
      <OnboardingStack.Screen name="OnboardingGenerating" component={OnboardingGeneratingScreen} />
    </OnboardingStack.Navigator>
  );
}

function MainTabs() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <MainTab.Screen name="Dashboard" component={DashboardScreen} />
      <MainTab.Screen name="Plan" component={ChecklistScreen} />
      <MainTab.Screen name="Budget" component={BudgetScreen} />
      <MainTab.Screen name="Vendors" component={VendorsScreen} />
    </MainTab.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={MainTabs} />
      <MainStack.Screen name="ChecklistItemDetail" children={() => <PlaceholderScreen name="Checklist Item" />} />
      <MainStack.Screen name="AddExpense" children={() => <PlaceholderScreen name="Add Expense" />} />
      <MainStack.Screen name="BudgetCategoryDetail" children={() => <PlaceholderScreen name="Budget Category" />} />
      <MainStack.Screen name="VendorDetail" children={() => <PlaceholderScreen name="Vendor Detail" />} />
      <MainStack.Screen name="AddEditVendor" children={() => <PlaceholderScreen name="Add/Edit Vendor" />} />
      <MainStack.Screen name="GuestList" component={GuestListScreen} />
      <MainStack.Screen name="AddEditGuest" children={() => <PlaceholderScreen name="Add/Edit Guest" />} />
      <MainStack.Screen name="AIAssistant" component={AIAssistantScreen} />
      <MainStack.Screen name="EventSettings" children={() => <PlaceholderScreen name="Event Settings" />} />
      <MainStack.Screen name="Profile" children={() => <PlaceholderScreen name="Profile" />} />
      <MainStack.Screen name="Notifications" children={() => <PlaceholderScreen name="Notifications" />} />
      <MainStack.Screen name="Upgrade" children={() => <PlaceholderScreen name="Upgrade" />} />
    </MainStack.Navigator>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function RootNavigator() {
  const { session, profile, initialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (!initialized) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const showOnboarding = session && profile && !profile.onboarding_done;
  const showMain = session && profile && profile.onboarding_done;

  return (
    <NavigationContainer>
      {!session && <AuthNavigator />}
      {showOnboarding && <OnboardingNavigator />}
      {showMain && <MainNavigator />}
    </NavigationContainer>
  );
}

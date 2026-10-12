import React from "react";
import { View, Text } from "react-native";

import Home from '../screens/Home';
import Comunidade from '../screens/Comunidade';
import PerfilPrivado from '../screens/PerfilPrivado';
import Tutor from '../screens/Tutor';

import { createBottomTabNavigator } from
    "@react-navigation/bottom-tabs";

import { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

// Telas provisórias para testar a navegação
function TelaProvisoria({ titulo }) {
    return (
        <View style={{
            flex: 1,
            backgroundColor: "#FFFDF8",
            justifyContent: "center",
            alignItems: "center",
        }}>
            <Text style={{
                fontSize: 25,
                color: "#332716",
                fontWeight: "bold",
            }}>
                {titulo}
            </Text>
        </View>
    );
}


export default function MainTabs() {
    return (
        <Tab.Navigator
            initialRouteName="Inicio"

            screenOptions={({ route }) => ({     
                headerShown: false,

                tabBarActiveTintColor: "#FA9F2A",
                tabBarInactiveTintColor: "#332716",

                tabBarStyle: {
                    backgroundColor: "#FFFDF8",
                    borderTopColor: "#FFEAC8",
                    borderTopWidth: 0.5,
                    paddingTop: 8,
                    height: 75,
                },

                tabBarLabelStyle: {
                    fontFamily: 'Ruwudu-Bold',
                    fontSize: 18,
                },

                tabBarIcon: ({ focused, color, size }) => {
                    let icone;

                    if (route.name === "Inicio") {
                        icone = focused ? "home" : "home-outline";
                    } else if (route.name === "Comunidade") {
                        icone = focused ? "happy" : "happy-outline";
                    } else if (route.name === "PetPrivado") {
                        icone = focused ? "paw" : "paw-outline";
                    } else if (route.name === "Tutor") {
                        icone = focused
                            ? "person-circle"
                            : "person-circle-outline";
                    }

                    return (
                        <Ionicons
                            name={icone}
                            size={25}
                            color={color}
                        />
                    );
                },
            })}
        >
            <Tab.Screen
                name="Inicio"
                component={Home}
                options={{ tabBarLabel: "Início" }}
            />

            <Tab.Screen
                name="Comunidade"
                component={Comunidade}
                options={{ tabBarLabel: "Comunidade" }}
            />

            <Tab.Screen
                name="PetPrivado"
                component={PerfilPrivado}
                options={{ tabBarLabel: "Meu Pet" }}
            />

            <Tab.Screen
                name="Tutor"
                component={Tutor}
                options={{ tabBarLabel: "Tutor" }}
            />

        </Tab.Navigator>
    );
}
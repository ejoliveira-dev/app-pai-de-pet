
import React, { useState, useCallback, useEffect } from "react";

import Home from "../screens/Home";
import Comunidade from "../screens/Comunidade";
import PerfilPrivado from "../screens/PerfilPrivado";
import Tutor from "../screens/Tutor";
import Notificacoes from "../screens/Notificacoes";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSQLiteContext } from "expo-sqlite";

import { listarNotificacoes } from "../utils/notificacoesStorage";
import { verificarAvisosVacinas } from "../utils/avisosVacinas";
import { verificarAvisosCuidados } from "../utils/avisosCuidados";
import { verificarAvisosAlimentacao } from "../utils/avisosAlimentacao";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
    const db = useSQLiteContext();
    const [naoLidas, setNaoLidas] = useState(0);

    const atualizarContador = useCallback(async () => {
        try {
            await verificarAvisosVacinas(db);
            await verificarAvisosCuidados(db);
            await verificarAvisosAlimentacao(db);

            const lista = await listarNotificacoes();
            setNaoLidas(lista.filter(item => !item.lida).length);
        } catch (erro) {
            console.error("Erro ao atualizar contador:", erro);
        }
    }, [db]);

    useEffect(() => {
        atualizarContador();
    }, [atualizarContador]);

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
                    fontFamily: "Ruwudu-Bold",
                    fontSize: 18,
                },

                tabBarIcon: ({ focused, color }) => {
                    let icone;

                    if (route.name === "Inicio") {
                        icone = focused ? "home" : "home-outline";
                    } else if (route.name === "Comunidade") {
                        icone = focused ? "happy" : "happy-outline";
                    } else if (route.name === "PetPrivado") {
                        icone = focused ? "paw" : "paw-outline";
                    } else if (route.name === "Notificacoes") {
                        icone = focused ? "notifications" : "notifications-outline";
                    } else if (route.name === "Tutor") {
                        icone = focused ? "person-circle" : "person-circle-outline";
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
                name="PetPrivado"
                component={PerfilPrivado}
                options={{ tabBarLabel: "Meu Pet" }}
            />

            <Tab.Screen
                name="Comunidade"
                component={Comunidade}
                options={{ tabBarLabel: "Comunidade" }}
            />

            <Tab.Screen
                name="Notificacoes"
                options={{
                    tabBarLabel: "Avisos",
                    tabBarBadge: naoLidas > 0 ? naoLidas : undefined,
                    tabBarBadgeStyle: {
                        backgroundColor: "#FA9F2A",
                        color: "#332716",
                        fontSize: 12,
                    },
                }}
            >
                {(props) => (
                    <Notificacoes
                        {...props}
                        onAtualizarContador={atualizarContador}
                    />
                )}
            </Tab.Screen>

            <Tab.Screen
                name="Tutor"
                component={Tutor}
                options={{ tabBarLabel: "Tutor" }}
            />
        </Tab.Navigator>
    );
}

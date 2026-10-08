import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
      >

        {/* Cabeçalho */}
        <View style={styles.blocoPet}>
      
          <Text style={styles.saudacao}>
            Olá, humano!
          </Text>

          <Text style={styles.subtitulo}>
            Veja como está seu pet hoje.
          </Text>

          {/* Pet selecionado */}
          <View style={styles.petCard}>

          <Image
            source={require('../../assets/images/pet1.jpg')}
            style={styles.fotoPet}
          />

          <View style={styles.infoPet}>
            <Text style={styles.nomePet}>
              Luna
            </Text>

            <Text style={styles.dadosPet}>
              Hamster • 6 meses
            </Text>
          </View>

          <Pressable>
            <Text style={styles.trocar}>
              Trocar
            </Text>
          </Pressable>
        </View>

    </View>

        {/* Resumo de hoje */ }

     {/* Próximos cuidados */ }

      </ScrollView >
    </View >

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },

  blocoPet: {
    backgroundColor: '#75571F',
    borderRadius: 28,
    padding: 36,
    marginBottom: 25,
},

  conteudo: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },

  saudacao: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#332716',
  },

  subtitulo: {
    fontSize: 16,
    color: '#FA9F2A',
    marginBottom: 25,
  },

  petCard: {
    backgroundColor: '#D18B5F',
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },

  fotoPet: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
  },

  infoPet: {
    flex: 1,
  },

  nomePet: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#332716',
  },

  dadosPet: {
    fontSize: 15,
    color: '#6B5A45',
  },

  trocar: {
    color: '#75571F',
    fontWeight: 'bold',
  },
});
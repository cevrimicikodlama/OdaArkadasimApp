import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';

export default function App() {
  // Kullanıcının girdiği verileri tuttuğumuz state'ler (değişkenler)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log("Giriş yapılıyor...", email);
    // İleride C# API'mize istek atacağımız fonksiyon burası olacak
  };

  return (
    // SafeAreaView ekran çentiklerinin (notch) tasarımın üstüne binmesini engeller
    <SafeAreaView style={styles.container}>
      
      {/* Klavye açıldığında input'ların altta kalmaması için ekranı yukarı kaydırır */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Oda Arkadaşım</Text>
          <Text style={styles.subtitle}>Yeni evine veya arkadaşına merhaba de!</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="E-posta"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            secureTextEntry // Şifreyi noktalı gösterir
            value={password}
            onChangeText={setPassword}
          />

          {/* TouchableOpacity, tıklandığında hafif saydamlaşan standart mobil butondur */}
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Giriş Yap</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerLink}>
            <Text style={styles.registerText}>
              Hesabın yok mu? <Text style={styles.registerTextBold}>Kayıt Ol</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA', // Açık gri/mavi arka plan
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#FFFFFF',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4299E1',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerText: {
    color: '#718096',
    fontSize: 14,
  },
  registerTextBold: {
    color: '#4299E1',
    fontWeight: 'bold',
  },
});
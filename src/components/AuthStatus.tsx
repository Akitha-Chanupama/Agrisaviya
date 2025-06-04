import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../utilities/firebaseConfig';
import { colors, fontSizes } from '../theme';

const AuthStatus = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Checking authentication status...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user ? (
        <Text style={styles.text}>
          Logged in as: {user.email}
        </Text>
      ) : (
        <Text style={styles.text}>
          Not logged in
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: colors.lightGray,
    borderRadius: 5,
    margin: 10,
  },
  text: {
    fontSize: fontSizes.md,
    color: colors.text,
  }
});

export default AuthStatus; 
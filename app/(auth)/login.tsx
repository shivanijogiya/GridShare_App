

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);


  return (
    <View style={styles.container}>


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1929',
    justifyContent: 'center',
    padding: 20,
  },

  title: {


  input: {
    backgroundColor: '#132f4c',
    color: '#fff',


  button: {
    backgroundColor: '#10b981',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',

  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },


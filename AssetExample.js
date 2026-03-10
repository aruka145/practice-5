import "react-native-gesture-handler";

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

/**
 * ===== API =====
 */
const API_BASE = "https://rickandmortyapi.com/api";

async function apiGet(path) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url);

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch (e) {}
    throw new Error(msg);
  }

  return res.json();
}

function fetchCharacters(page = 1, name = "") {
  const q = name ? `&name=${encodeURIComponent(name)}` : "";
  return apiGet(`/character?page=${page}${q}`);
}

function fetchLocations(page = 1, name = "") {
  const q = name ? `&name=${encodeURIComponent(name)}` : "";
  return apiGet(`/location?page=${page}${q}`);
}

function fetchEpisodes(page = 1, name = "") {
  const q = name ? `&name=${encodeURIComponent(name)}` : "";
  return apiGet(`/episode?page=${page}${q}`);
}

/**
 * ===== UI blocks =====
 */
function LoadingBlock({ text = "Загрузка..." }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
      <Text style={styles.mutedText}>{text}</Text>
    </View>
  );
}

function ErrorBlock({ error, onRetry }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>Ошибка: {String(error)}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>Повторить</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function SearchBar({ value, onChangeText, placeholder }) {
  return (
    <View style={styles.searchWrap}>
      <Ionicons name="search" size={18} style={{ marginRight: 8 }} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.searchInput}
        returnKeyType="search"
      />
      {!!value && (
        <TouchableOpacity onPress={() => onChangeText("")}>
          <Ionicons name="close-circle" size={18} />
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * ===== Characters =====
 */
function CharactersScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [queryDraft, setQueryDraft] = useState("");

  const firstLoad = async () => {
    try {
      setError("");
      setLoading(true);
      const data = await fetchCharacters(1, "");
      setItems(data.results ?? []);
      setPage(1);
      setHasNext(!!data.info?.next);
    } catch (e) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const load = async ({ reset = false } = {}) => {
    try {
      setError("");
      if (reset) {
        setLoading(true);
        const data = await fetchCharacters(1, query);
        setItems(data.results ?? []);
        setPage(1);
        setHasNext(!!data.info?.next);
      } else {
        if (!hasNext) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        const data = await fetchCharacters(nextPage, query);
        setItems((prev) => [...prev, ...(data.results ?? [])]);
        setPage(nextPage);
        setHasNext(!!data.info?.next);
      }
    } catch (e) {
      setError(e?.message ?? String(e));
      if (reset) setItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    firstLoad();
  }, []);

  useEffect(() => {
    load({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const onSubmitSearch = () => setQuery(queryDraft.trim());

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("Details", { type: "character", item })}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: (item.image || "").replace("http://", "https://") }}
        style={styles.avatar}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.mutedText}>Status: {item.status}</Text>
        <Text style={styles.mutedText}>Species: {item.species}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} />
    </TouchableOpacity>
  );

  if (loading) return <LoadingBlock text="Загрузка персонажей..." />;
  if (error) return <ErrorBlock error={error} onRetry={firstLoad} />;

  return (
    <SafeAreaView style={styles.screen}>
      <SearchBar
        value={queryDraft}
        onChangeText={setQueryDraft}
        placeholder="Поиск персонажей по имени (опц.)"
      />
      <TouchableOpacity style={styles.searchBtn} onPress={onSubmitSearch}>
        <Text style={styles.searchBtnText}>Найти</Text>
      </TouchableOpacity>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ paddingBottom: 16 }}
        onEndReached={() => {
          if (!loadingMore && hasNext) load({ reset: false });
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={{ marginTop: 12 }} /> : null
        }
      />
    </SafeAreaView>
  );
}

/**
 * ===== Locations =====
 */
function LocationsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [queryDraft, setQueryDraft] = useState("");

  const firstLoad = async () => {
    try {
      setError("");
      setLoading(true);
      const data = await fetchLocations(1, "");
      setItems(data.results ?? []);
      setPage(1);
      setHasNext(!!data.info?.next);
    } catch (e) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const load = async ({ reset = false } = {}) => {
    try {
      setError("");
      if (reset) {
        setLoading(true);
        const data = await fetchLocations(1, query);
        setItems(data.results ?? []);
        setPage(1);
        setHasNext(!!data.info?.next);
      } else {
        if (!hasNext) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        const data = await fetchLocations(nextPage, query);
        setItems((prev) => [...prev, ...(data.results ?? [])]);
        setPage(nextPage);
        setHasNext(!!data.info?.next);
      }
    } catch (e) {
      setError(e?.message ?? String(e));
      if (reset) setItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    firstLoad();
  }, []);

  useEffect(() => {
    load({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const onSubmitSearch = () => setQuery(queryDraft.trim());

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("Details", { type: "location", item })}
      activeOpacity={0.85}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.mutedText}>Type: {item.type}</Text>
        <Text style={styles.mutedText}>Dimension: {item.dimension}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} />
    </TouchableOpacity>
  );

  if (loading) return <LoadingBlock text="Загрузка локаций..." />;
  if (error) return <ErrorBlock error={error} onRetry={firstLoad} />;

  return (
    <SafeAreaView style={styles.screen}>
      <SearchBar
        value={queryDraft}
        onChangeText={setQueryDraft}
        placeholder="Поиск локаций по названию (опц.)"
      />
      <TouchableOpacity style={styles.searchBtn} onPress={onSubmitSearch}>
        <Text style={styles.searchBtnText}>Найти</Text>
      </TouchableOpacity>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ paddingBottom: 16 }}
        onEndReached={() => {
          if (!loadingMore && hasNext) load({ reset: false });
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={{ marginTop: 12 }} /> : null
        }
      />
    </SafeAreaView>
  );
}

/**
 * ===== Episodes =====
 */
function EpisodesScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [queryDraft, setQueryDraft] = useState("");

  const firstLoad = async () => {
    try {
      setError("");
      setLoading(true);
      const data = await fetchEpisodes(1, "");
      setItems(data.results ?? []);
      setPage(1);
      setHasNext(!!data.info?.next);
    } catch (e) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const load = async ({ reset = false } = {}) => {
    try {
      setError("");
      if (reset) {
        setLoading(true);
        const data = await fetchEpisodes(1, query);
        setItems(data.results ?? []);
        setPage(1);
        setHasNext(!!data.info?.next);
      } else {
        if (!hasNext) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        const data = await fetchEpisodes(nextPage, query);
        setItems((prev) => [...prev, ...(data.results ?? [])]);
        setPage(nextPage);
        setHasNext(!!data.info?.next);
      }
    } catch (e) {
      setError(e?.message ?? String(e));
      if (reset) setItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    firstLoad();
  }, []);

  useEffect(() => {
    load({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const onSubmitSearch = () => setQuery(queryDraft.trim());

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("Details", { type: "episode", item })}
      activeOpacity={0.85}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.mutedText}>Code: {item.episode}</Text>
        <Text style={styles.mutedText}>Air date: {item.air_date}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} />
    </TouchableOpacity>
  );

  if (loading) return <LoadingBlock text="Загрузка эпизодов..." />;
  if (error) return <ErrorBlock error={error} onRetry={firstLoad} />;

  return (
    <SafeAreaView style={styles.screen}>
      <SearchBar
        value={queryDraft}
        onChangeText={setQueryDraft}
        placeholder="Поиск эпизодов по названию (опц.)"
      />
      <TouchableOpacity style={styles.searchBtn} onPress={onSubmitSearch}>
        <Text style={styles.searchBtnText}>Найти</Text>
      </TouchableOpacity>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ paddingBottom: 16 }}
        onEndReached={() => {
          if (!loadingMore && hasNext) load({ reset: false });
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={{ marginTop: 12 }} /> : null
        }
      />
    </SafeAreaView>
  );
}

/**
 * ===== Details =====
 */
function DetailsScreen({ route }) {
  const { type, item } = route.params;

  const title = useMemo(() => {
    if (type === "character") return "Персонаж";
    if (type === "location") return "Локация";
    if (type === "episode") return "Эпизод";
    return "Детали";
  }, [type]);

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.detailsHeader}>{title}</Text>

      {type === "character" ? (
        <View style={styles.detailsCard}>
          <Image
            source={{ uri: (item.image || "").replace("http://", "https://") }}
            style={styles.detailsAvatar}
          />
          <Text style={styles.detailsTitle}>{item.name}</Text>
          <Text style={styles.detailsRow}>Status: {item.status}</Text>
          <Text style={styles.detailsRow}>Species: {item.species}</Text>
          <Text style={styles.detailsRow}>Gender: {item.gender}</Text>
          <Text style={styles.detailsRow}>
            Origin: {item.origin?.name ?? "-"}
          </Text>
          <Text style={styles.detailsRow}>
            Location: {item.location?.name ?? "-"}
          </Text>
        </View>
      ) : null}

      {type === "location" ? (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>{item.name}</Text>
          <Text style={styles.detailsRow}>Type: {item.type}</Text>
          <Text style={styles.detailsRow}>Dimension: {item.dimension}</Text>
          <Text style={styles.detailsRow}>
            Residents: {Array.isArray(item.residents) ? item.residents.length : 0}
          </Text>
          <Text style={styles.detailsRow}>Created: {item.created}</Text>
        </View>
      ) : null}

      {type === "episode" ? (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>{item.name}</Text>
          <Text style={styles.detailsRow}>Code: {item.episode}</Text>
          <Text style={styles.detailsRow}>Air date: {item.air_date}</Text>
          <Text style={styles.detailsRow}>
            Characters:{" "}
            {Array.isArray(item.characters) ? item.characters.length : 0}
          </Text>
          <Text style={styles.detailsRow}>Created: {item.created}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/**
 * ===== Navigation =====
 */
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: "center",
        tabBarIcon: ({ focused, size }) => {
          let name = "list";
          if (route.name === "Characters")
            name = focused ? "people" : "people-outline";
          if (route.name === "Locations")
            name = focused ? "planet" : "planet-outline";
          if (route.name === "Episodes")
            name = focused ? "film" : "film-outline";
          return <Ionicons name={name} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Characters" component={CharactersScreen} options={{ title: "Персонажи" }} />
      <Tab.Screen name="Locations" component={LocationsScreen} options={{ title: "Локации" }} />
      <Tab.Screen name="Episodes" component={EpisodesScreen} options={{ title: "Эпизоды" }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
        <Stack.Screen name="Home" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="Details" component={DetailsScreen} options={{ title: "Детали" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/**
 * ===== Styles =====
 */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 8 : 0,
    paddingHorizontal: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  mutedText: { opacity: 0.7, marginTop: 6 },
  errorText: { color: "#b00020", textAlign: "center" },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "white",
  },
  avatar: { width: 54, height: 54, borderRadius: 12, marginRight: 12 },
  title: { fontSize: 16, fontWeight: "600" },

  retryBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
  },
  retryText: { fontWeight: "600" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    marginTop: 10,
    backgroundColor: "white",
  },
  searchInput: { flex: 1, fontSize: 14 },
  searchBtn: {
    marginTop: 10,
    marginBottom: 4,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "white",
  },
  searchBtnText: { fontWeight: "700" },

  detailsHeader: { fontSize: 18, fontWeight: "800", marginTop: 12 },
  detailsCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "white",
  },
  detailsAvatar: { width: "100%", height: 280, borderRadius: 14 },
  detailsTitle: { fontSize: 20, fontWeight: "800", marginTop: 12 },
  detailsRow: { marginTop: 8, fontSize: 14, opacity: 0.85 },
});

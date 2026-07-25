// UI-chrome translations. Editorial trip prose (day titles, stop descriptions,
// optional write-ups, Important Notes blocks) intentionally stays English.
export const STRINGS = {
  en: {
    // login
    login_sub: "Sign in to view & edit the shared itinerary",
    login_name: "Name",
    login_password: "Password",
    login_enter: "Enter →",
    login_signing: "Signing in…",
    err_not_configured: "Sign-in isn't configured yet — see README.",
    err_empty: "Enter your name and password.",
    err_mismatch: "That name and password don't match.",
    // hero
    hero_sub: "A high-energy 10-day loop for two · Aug 13 – 22, 2026",
    stat_days: "Days",
    stat_nights: "Nights",
    stat_regions: "Regions",
    total_trip_cost: "Total Trip Cost",
    logout: "Log out",
    // nav
    nav_overview: "🗺️ Overview",
    nav_itinerary: "📅 Itinerary",
    // overview
    ov_total_cost: "Total cost (USD)",
    ov_in_transit: "In transit",
    ov_days: "Days",
    ov_nights: "Nights",
    ov_where_sleep: "🏨 Where you sleep",
    ov_getting_around: "🚌 Getting around",
    ov_total_ground: "Total ground transit",
    ov_note: "Estimated door-to-door times for the ground transfers; excursion boat rides aren't counted. Cost is the total transport fare for the couple.",
    ov_night: "night",
    ov_nights_plural: "nights",
    ov_days_range: "Days {a}–{b}",
    ov_day_single: "Day {a}",
    // day card
    day_total: "day total",
    swappable: "🔁 swappable",
    gmaps_link: "🗺️ Open this day's route in Google Maps →",
    wx_link: "🌦️ {place} weather on AccuWeather →",
    // stop / leg
    tag_buy_ahead: "🕓 Buy ahead",
    tag_on_spot: "📍 On the spot",
    tag_free: "📍 Free",
    leg_incl: "· incl.",
    // booking tracker
    bt_tracker: "🎟️ {label} — booking tracker",
    bt_booked: "✅ Booked",
    bt_buy_ahead: "🕓 Buy ahead",
    bt_mark_booked: "Mark as booked & paid",
    bt_agency: "Agency / operator",
    bt_price_couple: "Price paid · couple (USD)",
    // accommodation
    acc_title: "🏨 Accommodation — {stay}",
    acc_booked: "✅ Booked",
    acc_not_booked: "🕓 Not booked",
    acc_booked_short: "Booked",
    acc_not_booked_short: "Not booked",
    acc_nightly_rate: "Nightly rate:",
    acc_place_name: "Place name",
    acc_place_name_ph: "Hotel / Airbnb name",
    acc_price_night: "Price · night (USD)",
    acc_free_cancel_until: "Free cancellation until",
    acc_booking_notes: "Booking notes",
    acc_booking_notes_ph: "e.g. free cancellation until 28/07",
    acc_booking_link: "Booking link",
    acc_open_booking: "🔗 Open booking →",
    acc_cancel_free: "🟢 Free cancellation until {date}",
    acc_cancel_none: "🔒 No free cancellation",
    acc_default_suffix: " (default)",
    // optionals
    opt_head: "🔀 {label} — tap to choose",
    opt_pick: "PICK",
    opt_free: "Free",
    // todo
    todo_head: "✅ Trip To-Do",
    todo_add_ph: "Add a task…",
    todo_add_btn: "Add",
    // chat
    chat_head: "💬 Day chat",
    chat_input_ph: "Write a note, reminder or debate for this day…",
    chat_offline: "💤 Day chat needs the live online page to sync.",
    chat_empty: "No messages yet — start the conversation.",
    chat_delete_confirm: "Delete this message?",
    // alerts
    alerts_title: "🔔 Unread messages",
    alerts_mark_all: "Mark all as read",
    alerts_empty: "🎉 You're all caught up — no unread messages.",
    // relative time
    time_just_now: "just now",
    time_min_ago: "{n}m ago",
    time_hour_ago: "{n}h ago",
    // notes panel
    notes_btn: "💡 Important Notes",
    notes_title: "💡 Important Notes",
    // legend
    legend_title: "Legend",
    legend_buy_spot: "📍 Buy on the spot",
    legend_buy_ahead: "🕓 Buy ahead",
    legend_booked: "✅ Booked",
    legend_activity: "Activity",
    legend_cost: "Cost",
    legend_my_pick: "My pick",
    // banners / footer (may contain <b>…</b>)
    savenote_html: "Booking details, accommodation & to-dos <b>sync live for everyone</b> — edit on any phone or laptop and the change shows up for the whole group within a second. (Live sync and the maps need the hosted page online; inside the chat preview it falls back to saving on this device only.)",
    warnbanner_html: "Prices are USD for the couple. Only <b>Scape Park ($120pp)</b> and taxi rates are your confirmed quotes; the rest are estimates (⚠ = unverified). Toggle optionals, mark things booked, add accommodation — every total updates live.",
    foot_html: "Maps © OpenStreetMap contributors · markers are exact; the line connects stops in order (straight-line). Tap “open in Google Maps” for live road navigation.<br>Tap <b>Important Notes</b> for the reasoning behind the route.",
    // confirms
    reset_confirm: "Clear all shared booking, accommodation & to-do entries and reset optionals to the recommended picks?",
  },
  es: {
    // login
    login_sub: "Inicia sesión para ver y editar el itinerario compartido",
    login_name: "Nombre",
    login_password: "Contraseña",
    login_enter: "Entrar →",
    login_signing: "Iniciando sesión…",
    err_not_configured: "El inicio de sesión aún no está configurado — consulta el README.",
    err_empty: "Escribe tu nombre y contraseña.",
    err_mismatch: "Ese nombre y contraseña no coinciden.",
    // hero
    hero_sub: "Una ruta intensa de 10 días para dos · 13 – 22 ago 2026",
    stat_days: "Días",
    stat_nights: "Noches",
    stat_regions: "Regiones",
    total_trip_cost: "Costo total del viaje",
    logout: "Cerrar sesión",
    // nav
    nav_overview: "🗺️ Resumen",
    nav_itinerary: "📅 Itinerario",
    // overview
    ov_total_cost: "Costo total (USD)",
    ov_in_transit: "En tránsito",
    ov_days: "Días",
    ov_nights: "Noches",
    ov_where_sleep: "🏨 Dónde duermes",
    ov_getting_around: "🚌 Cómo moverte",
    ov_total_ground: "Transporte terrestre total",
    ov_note: "Tiempos puerta a puerta estimados para los traslados terrestres; los paseos en barco de las excursiones no se cuentan. El costo es la tarifa total de transporte para la pareja.",
    ov_night: "noche",
    ov_nights_plural: "noches",
    ov_days_range: "Días {a}–{b}",
    ov_day_single: "Día {a}",
    // day card
    day_total: "total del día",
    swappable: "🔁 intercambiable",
    gmaps_link: "🗺️ Abre la ruta de este día en Google Maps →",
    wx_link: "🌦️ Clima de {place} en AccuWeather →",
    // stop / leg
    tag_buy_ahead: "🕓 Compra con antelación",
    tag_on_spot: "📍 En el lugar",
    tag_free: "📍 Gratis",
    leg_incl: "· incl.",
    // booking tracker
    bt_tracker: "🎟️ {label} — seguimiento de reserva",
    bt_booked: "✅ Reservado",
    bt_buy_ahead: "🕓 Compra con antelación",
    bt_mark_booked: "Marcar como reservado y pagado",
    bt_agency: "Agencia / operador",
    bt_price_couple: "Precio pagado · pareja (USD)",
    // accommodation
    acc_title: "🏨 Alojamiento — {stay}",
    acc_booked: "✅ Reservado",
    acc_not_booked: "🕓 Sin reservar",
    acc_booked_short: "Reservado",
    acc_not_booked_short: "Sin reservar",
    acc_nightly_rate: "Tarifa por noche:",
    acc_place_name: "Nombre del lugar",
    acc_place_name_ph: "Nombre de hotel / Airbnb",
    acc_price_night: "Precio · noche (USD)",
    acc_free_cancel_until: "Cancelación gratis hasta",
    acc_booking_notes: "Notas de reserva",
    acc_booking_notes_ph: "p. ej. cancelación gratis hasta 28/07",
    acc_booking_link: "Enlace de reserva",
    acc_open_booking: "🔗 Abrir reserva →",
    acc_cancel_free: "🟢 Cancelación gratis hasta {date}",
    acc_cancel_none: "🔒 Sin cancelación gratis",
    acc_default_suffix: " (predet.)",
    // optionals
    opt_head: "🔀 {label} — toca para elegir",
    opt_pick: "ELEGIDO",
    opt_free: "Gratis",
    // todo
    todo_head: "✅ Tareas del viaje",
    todo_add_ph: "Añadir una tarea…",
    todo_add_btn: "Añadir",
    // chat
    chat_head: "💬 Chat del día",
    chat_input_ph: "Escribe una nota, recordatorio o debate para este día…",
    chat_offline: "💤 El chat del día necesita la página en línea para sincronizar.",
    chat_empty: "Aún no hay mensajes — empieza la conversación.",
    chat_delete_confirm: "¿Eliminar este mensaje?",
    // alerts
    alerts_title: "🔔 Mensajes sin leer",
    alerts_mark_all: "Marcar todo como leído",
    alerts_empty: "🎉 Estás al día — no hay mensajes sin leer.",
    // relative time
    time_just_now: "ahora mismo",
    time_min_ago: "hace {n} min",
    time_hour_ago: "hace {n} h",
    // notes panel
    notes_btn: "💡 Notas importantes",
    notes_title: "💡 Notas importantes",
    // legend
    legend_title: "Leyenda",
    legend_buy_spot: "📍 Compra en el lugar",
    legend_buy_ahead: "🕓 Compra con antelación",
    legend_booked: "✅ Reservado",
    legend_activity: "Actividad",
    legend_cost: "Costo",
    legend_my_pick: "Mi elección",
    // banners / footer (may contain <b>…</b>)
    savenote_html: "Los detalles de reserva, alojamiento y tareas <b>se sincronizan en vivo para todos</b> — edita en cualquier teléfono o laptop y el cambio aparece para todo el grupo en un segundo. (La sincronización en vivo y los mapas necesitan la página en línea; dentro de la vista previa del chat, guarda solo en este dispositivo.)",
    warnbanner_html: "Los precios son en USD para la pareja. Solo <b>Scape Park ($120 p.p.)</b> y las tarifas de taxi son cotizaciones confirmadas; el resto son estimaciones (⚠ = sin verificar). Activa opcionales, marca cosas como reservadas, añade alojamiento — cada total se actualiza en vivo.",
    foot_html: "Mapas © colaboradores de OpenStreetMap · los marcadores son exactos; la línea conecta las paradas en orden (línea recta). Toca “abrir en Google Maps” para navegación por carretera en vivo.<br>Toca <b>Notas importantes</b> para ver el razonamiento de la ruta.",
    // confirms
    reset_confirm: "¿Borrar todas las entradas compartidas de reserva, alojamiento y tareas, y restablecer los opcionales a las opciones recomendadas?",
  },
};

// translate(key, lang, vars) with {var} interpolation; falls back to English, then the key.
export function translate(key, lang, vars) {
  const table = STRINGS[lang] || STRINGS.en;
  let s = (table[key] != null) ? table[key] : (STRINGS.en[key] != null ? STRINGS.en[key] : key);
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(String(vars[k]));
  return s;
}

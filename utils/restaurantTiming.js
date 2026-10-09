const DAY_ORDER = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const normalizeDay = value => {
  if (!value) return "";
  const day = String(value).trim();
  const direct = DAY_ORDER.find(item => item.toLowerCase() === day.toLowerCase());
  if (direct) return direct;

  const short = day.slice(0, 3).toLowerCase();
  const match = DAY_ORDER.find(item => item.slice(0, 3).toLowerCase() === short);
  return match || day;
};

const parseMeridiem = (timeValue, meridiem) => {
  const raw = String(timeValue ?? "").trim();
  if (!raw) return null;

  const normalized = raw.replace(/\s+/g, " ");
  const meridian = String(meridiem ?? "").trim().toUpperCase();
  const hasExplicitMeridian = /(AM|PM)/i.test(normalized);
  const timePart = hasExplicitMeridian ? normalized.replace(/(AM|PM)/i, "").trim() : normalized;
  const [hoursPart, minutesPart = "0"] = timePart.split(":");
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  let totalMinutes = hours * 60 + minutes;
  const parsedMeridian = hasExplicitMeridian ? normalized.match(/(AM|PM)/i)?.[1]?.toUpperCase() : meridian;

  if (parsedMeridian === "PM" && hours < 12) totalMinutes += 12 * 60;
  if (parsedMeridian === "AM" && hours === 12) totalMinutes = minutes;

  return totalMinutes;
};

const getMinutes = value => {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return value;
  }

  const str = String(value).trim();
  if (!str) return null;

  if (/^\d+$/.test(str)) {
    return Number(str);
  }

  const [timePart, meridianPart] = str.split(/\s+/);
  if (timePart && timePart.includes(":")) {
    return parseMeridiem(timePart, meridianPart || "");
  }

  const support = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (support) {
    const hour = Number(support[1]);
    const minute = Number(support[2] || 0);
    let minutes = hour * 60 + minute;
    const meridian = (support[3] || "").toUpperCase();
    if (meridian === "PM" && hour < 12) minutes += 12 * 60;
    if (meridian === "AM" && hour === 12) minutes = minute;
    return minutes;
  }

  return null;
};

const getRestaurantOpenStatus = (timings = [], referenceDate = new Date()) => {
  if (!Array.isArray(timings) || timings.length === 0) return true;

  const currentDay = DAY_ORDER[referenceDate.getDay()];
  const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();

  const todayTimings = timings.filter(item => {
    const day = normalizeDay(item?.day);
    return day === currentDay || day === currentDay.slice(0, 3);
  });

  if (todayTimings.length === 0) return false;

  return todayTimings.some(item => {
    const status = item?.staus ?? item?.status ?? item?.isActive ?? true;
    if (!status) return false;

    const startMinutes = getMinutes(item?.startTime) ?? getMinutes(`${item?.startTime || "09:00"} ${item?.startTimeFormate || "AM"}`);
    const endMinutes = getMinutes(item?.endTime) ?? getMinutes(`${item?.endTime || "09:00"} ${item?.endTimeFormate || "PM"}`);

    if (startMinutes === null || endMinutes === null) return true;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  });
};

const withTimingMeta = restaurant => {
  if (!restaurant || typeof restaurant !== "object") return restaurant;

  const isOpenNow = getRestaurantOpenStatus(restaurant.open_timings);

  return {
    ...restaurant,
    isOpenNow,
    isClosed: !isOpenNow,
    openStatus: isOpenNow ? "open" : "closed",
  };
};

module.exports = {
  DAY_ORDER,
  normalizeDay,
  parseMeridiem,
  getMinutes,
  getRestaurantOpenStatus,
  withTimingMeta,
};

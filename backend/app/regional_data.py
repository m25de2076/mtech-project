REGIONAL_SUMMARY = {
    "headline": {
        "valid_hourly_observations": 417818,
        "retained_stations": 48,
        "valid_station_days": 17998,
        "long_record_stations": 25,
    },
    "top_stations": [
        {"station": "Jewargi_1", "valid_days": 688, "p95_hourly_c": 36.90, "hours_ge_35_pct": 8.53, "day_night_c": 7.03},
        {"station": "Mahagaon Cross", "valid_days": 673, "p95_hourly_c": 36.68, "hours_ge_35_pct": 7.91, "day_night_c": 6.43},
        {"station": "Afzalpur_1", "valid_days": 739, "p95_hourly_c": 36.53, "hours_ge_35_pct": 7.63, "day_night_c": 7.08},
        {"station": "Yermarus Camp", "valid_days": 727, "p95_hourly_c": 36.26, "hours_ge_35_pct": 7.23, "day_night_c": 5.99},
        {"station": "Narayanpur_7", "valid_days": 775, "p95_hourly_c": 35.43, "hours_ge_35_pct": 5.71, "day_night_c": 6.88},
    ],
    "methodology": [
        "Temperature values outside 0-50 °C were excluded from the regional screening workflow.",
        "At least two valid sub-hourly observations were required to form an hourly mean.",
        "A valid station-day required at least 12 valid hourly temperature observations.",
        "Stations with at least 180 valid station-days were used for headline comparison.",
    ],
    "interpretation": (
        "NWDP is retained as the regional climate-context layer. These station-level results support regional heat screening "
        "and should not be interpreted as building- or street-level thermal measurements."
    ),
}

package com.example.contentmanagement.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonMappingException;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;

/**
 * Accepts either ISO date-time (yyyy-MM-ddTHH:mm:ss) or date-only (yyyy-MM-dd).
 * Date-only values are normalized to start-of-day (00:00:00).
 */
public class FlexibleLocalDateTimeDeserializer extends JsonDeserializer<LocalDateTime> {

    @Override
    public LocalDateTime deserialize(JsonParser parser, DeserializationContext ctxt)
            throws IOException, JsonProcessingException {
        final String raw = parser.getValueAsString();
        if (raw == null) {
            return null;
        }

        final String value = raw.trim();
        if (value.isEmpty()) {
            return null;
        }

        try {
            if (value.length() == 10) {
                return LocalDate.parse(value).atStartOfDay();
            }
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException ex) {
            throw JsonMappingException.from(
                    parser,
                    "Invalid releaseDate format. Use yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss",
                    ex
            );
        }
    }
}

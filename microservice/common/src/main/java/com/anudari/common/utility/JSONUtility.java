package com.anudari.common.utility;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

import java.io.InputStream;
import java.util.List;
import java.util.Optional;

import com.anudari.common.constant.*;

public final class JSONUtility {

    private static final ObjectMapper MAPPER = JsonMapper.builder()
            .addModule(javaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
            .build();

    private JSONUtility() {
    }

    private static Module javaTimeModule() {
        return new JavaTimeModule();
    }

    public static String toJSON(Object object) {
        String json = "EMPTY";
        if (object != null) {
            try {
                json = MAPPER.writeValueAsString(object);
            } catch (JsonProcessingException ex) {
                LogUtility.error(JSONUtility.class.getName(), null, AppConstants.ENTITY_TYPE.JSON,
                        "[JsonProcessingException]" + ex.getMessage());
            }
        }
        return json;
    }

    public static JSONObject stringToJSONObject(String jsonString) {
        try {
            return new JSONObject(jsonString);
        } catch (JSONException ex) {
            LogUtility.error(JSONUtility.class.getName(), null, AppConstants.ENTITY_TYPE.JSON,
                    "[JSONException][" + ex.getMessage() + "]");
            return new JSONObject();
        }
    }

    public static JsonNode jsonToJsonNode(String jsonString) {
        ObjectMapper mapper = new ObjectMapper();
        try {
            return mapper.readTree(jsonString);
        } catch (JsonProcessingException ex) {
            LogUtility.error(JSONUtility.class.getName(), null, AppConstants.ENTITY_TYPE.JSON,
                    "[JsonProcessingException][" + ex.getMessage() + "]");
            return null;
        }
    }

    public static JSONArray getAsJSONArray(JSONObject jsonObject, String key) {
        JSONArray jsonArray = new JSONArray();
        if (jsonObject.has(key)) {
            if (jsonObject.get(key) instanceof JSONArray) {
                jsonArray = jsonObject.getJSONArray(key);
            } else if (jsonObject.get(key) instanceof JSONObject) {
                jsonArray.put(jsonObject.getJSONObject(key));
            }
        }
        return jsonArray;
    }

    public static JSONObject readFileAsJsonObject(String resourceName) {
        InputStream inputStream = JSONUtility.class.getClassLoader().getResourceAsStream(resourceName);
        return inputStream == null ? null : new JSONObject(new JSONTokener(inputStream));
    }

    public static <T> Optional<T> readValue(String data, Class<T> clz) {
        try {
            return Optional.of(MAPPER.readValue(data, clz));
        } catch (JsonMappingException ex) {
            LogUtility.error(JSONUtility.class.getName(), null, AppConstants.ENTITY_TYPE.JSON,
                    "[JsonMappingException][" + ex.getMessage() + "]");
            return Optional.empty();
        } catch (JsonProcessingException ex) {
            LogUtility.error(JSONUtility.class.getName(), null, AppConstants.ENTITY_TYPE.JSON,
                    "[JsonProcessingException][" + ex.getMessage() + "]");
            return Optional.empty();
        }
    }

    public static <T> List<T> readListValue(String respBody, Class<T> tClass) {
        try {
            return MAPPER.readerForListOf(tClass).readValue(respBody);
        } catch (JsonMappingException ex) {
            LogUtility.error(JSONUtility.class.getName(), null, AppConstants.ENTITY_TYPE.JSON,
                    "[JsonMappingException][" + ex.getMessage() + "]");
        } catch (JsonProcessingException ex) {
            LogUtility.error(JSONUtility.class.getName(), null, AppConstants.ENTITY_TYPE.JSON,
                    "[JsonProcessingException][" + ex.getMessage() + "]");
        }
        return null;
    }
}
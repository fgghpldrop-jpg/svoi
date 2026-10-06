using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Svoi.Application.Common.Interfaces;
using Svoi.Application.DTOs;

namespace Svoi.Infrastructure.Services;

public class LlmBioGeneratorService : ILlmBioGeneratorService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<LlmBioGeneratorService> _logger;

    public LlmBioGeneratorService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<LlmBioGeneratorService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> GenerateBioAsync(AiBioRequestDto request, CancellationToken ct = default)
    {
        var apiKey = _configuration["Llm:ApiKey"];
        var model = _configuration["Llm:Model"] ?? "gemini-1.5-flash";

        var prompt = BuildPrompt(request);

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            try
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";
                var payload = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new[]
                            {
                                new { text = prompt }
                            }
                        }
                    },
                    generationConfig = new
                    {
                        temperature = 0.8,
                        maxOutputTokens = 200
                    }
                };

                var response = await _httpClient.PostAsJsonAsync(url, payload, ct);
                if (response.IsSuccessStatusCode)
                {
                    var responseJson = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
                    var candidates = responseJson.GetProperty("candidates");
                    if (candidates.GetArrayLength() > 0)
                    {
                        var text = candidates[0]
                            .GetProperty("content")
                            .GetProperty("parts")[0]
                            .GetProperty("text")
                            .GetString();

                        if (!string.IsNullOrWhiteSpace(text))
                        {
                            return text.Trim();
                        }
                    }
                }
                else
                {
                    var err = await response.Content.ReadAsStringAsync(ct);
                    _logger.LogWarning("LLM API returned error: {Error}", err);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate bio via LLM API, using localized Bobruisk template");
            }
        }

        // High-fidelity fallback bio tailored to persona & Bobruisk culture
        return GenerateFallbackBio(request);
    }

    private static string BuildPrompt(AiBioRequestDto request)
    {
        var tagsStr = request.Tags != null && request.Tags.Count > 0 ? string.Join(", ", request.Tags) : "прогулки, отдых";
        return $"""
            Ты — AI-ассистент молодежного приложения «СВОИ» для города Бобруйск (Беларусь).
            Твоя задача — составить классное, живое и цепляющее описание профиля (до 200 символов) для пользователя, чтобы с ним хотелось пойти гулять в реале.
            
            Входные данные анкеты:
            - Характер текста: {request.Personality ?? "дружелюбный"} (выдерживай именно этот тон: дерзкий / дружелюбный / краткий / ироничный)
            - Интересы и теги: {tagsStr}
            - Любимые споты в Бобруйске: {request.FavoriteSpotsInBobruisk ?? "Социалка, Набережная Березины, Молодежный парк"}
            - Вайб / музыка: {request.MusicOrVibe ?? "ночные прогулки под инди и фонк"}
            - Хобби: {request.Hobbies ?? "движ на свежем воздухе"}
            
            Требования:
            1. Максимум 2-3 ярких предложения.
            2. Локальный контекст Бобруйска (Социалка, Березина, бобры, кофе на пешеходке).
            3. Никаких банальностей, только живая энергия. Не пиши кавычки вокруг ответа.
            """;
    }

    private static string GenerateFallbackBio(AiBioRequestDto req)
    {
        var personality = req.Personality?.ToLower() ?? "дружелюбный";
        var tags = req.Tags ?? new System.Collections.Generic.List<string>();

        return personality switch
        {
            "дерзкий" => "Не сижу дома, когда на Социалке вечерний движ. " +
                         (tags.Contains("#спорт") ? "Стрит-воркаут или быстрый темп по городу. " : "Если выходить — то на максимум. ") +
                         "Лови меня у Березины или собирай клан!",

            "ироничный" => "Легенда Бобруйских тротуаров. Шаурма на Минской, кофе на пешеходке и вечные поиски тех, кто реально готов гулять, а не просто лайкать.",

            "краткий" => "Бобруйск. Движ. " + (tags.Count > 0 ? string.Join(" ", tags) : "#прогулка") + ". Всегда за совместный выход.",

            _ => "Гуляю по Бобруйску, ловлю закаты на Березине и слушаю хорошую музыку. Рад(а) новым людям в клане для совместных прогулок и кофе на Социалке!"
        };
    }
}

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIGeneratedRoadmap {
  goalName: string;
  groups: {
    id: string;
    name: string;
    durationInDays: number;
    status: 'active' | 'locked' | 'completed';
    tasks: { id: string; name: string; isCompleted: boolean }[];
  }[];
}

const SYSTEM_INSTRUCTION = `
Sen Habit Journey uygulaması için uzman bir alışkanlık ve hedef haritası oluşturucususun.
Kullanıcı sana hedefini (örn: İspanyolca öğrenmek, 3 ayda fit bir vücut, yazılıma başlamak) söyleyecek.
Senin görevin, bu hedefi başarması için tamamen mantıklı, ayakları yere basan ve aşamalara bölünmüş bir yol haritası (JSON) oluşturmak.

Kurallar:
1. SADECE JSON formatında veri döndür. Markdown (\`\`\`) işaretleri KESİNLİKLE KULLANMA. Saf parse edilebilir text döndür.
2. Hedefi mantıklı aşamalara (groups/stages) böl. (En az 2, en fazla 5 aşama olsun).
3. Her aşamaya pratik uygulanabilir günlük görevler (tasks) yaz. (Her aşamada 2-4 görev).
4. Kullanıcının dilini anla ve JSON içerisindeki tüm metinleri o dilde (genelde Türkçe) yanıtla.

Zorunlu JSON Formatı:
{
  "goalName": "Hedefin havalı başlığı",
  "stages": [
    {
      "name": "1. Aşamanın Adı",
      "durationInDays": 14,
      "taskTitles": ["Günlük birinci görev", "Günlük ikinci görev"]
    }
  ]
}
`;

export async function generateJourneyRoadmap(prompt: string, apiKey: string): Promise<AIGeneratedRoadmap> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('NO_API_KEY');
  }

  try {
    // CRITICAL FIX: Invisible spaces at the end of the API Key cause a 404 "Model not found" error on Google's v1beta gateway.
    const cleanApiKey = apiKey.trim();
    const genAI = new GoogleGenerativeAI(cleanApiKey);
    
    // Explicitly mapping to gemini-2.5-flash (the most budget-friendly, lighting fast, and newest stable node per user direction)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash'
    });

    const fullPrompt = `${SYSTEM_INSTRUCTION}\n\nKullanıcı İsteği: ${prompt}\n\nDİKKAT: YALNIZCA KATI JSON FORMATINDA (MARKDOWN OLMADAN, DİREKT OBJEDEN BAŞLAYARAK) YANIT VER.`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
    });

    const responseText = result.response.text();
    let cleanJson = responseText.trim();
    
    // Safety regex and trim checks to ensure raw JSON
    if (cleanJson.startsWith('\`\`\`json')) {
      cleanJson = cleanJson.replace('\`\`\`json', '').replace('\`\`\`', '');
    }
    if (cleanJson.startsWith('\`\`\`')) {
       cleanJson = cleanJson.replace(/```/g, '');
    }

    const parsedData = JSON.parse(cleanJson.trim());

    const mappedGroups = parsedData.stages.map((stage: any, index: number) => {
      const mappedTasks = stage.taskTitles.map((title: string) => ({
        id: Math.random().toString(),
        name: title,
        isCompleted: false
      }));

      return {
        id: Math.random().toString(),
        name: stage.name,
        durationInDays: stage.durationInDays || 7,
        status: index === 0 ? 'active' : 'locked',
        tasks: mappedTasks,
      };
    });

    return {
      goalName: parsedData.goalName || 'Otonom Yolculuk',
      groups: mappedGroups,
    };
  } catch (error) {
    console.error('AI Generation Error:', error);
    throw error;
  }
}

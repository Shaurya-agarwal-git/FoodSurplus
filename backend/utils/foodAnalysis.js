import anthropic from '../config/claude.js';
import axios from 'axios';

// Analyze food image using Claude API
export const analyzeFoodImage = async (imageUrl) => {
  try {
    // Download image and convert to base64
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(response.data).toString('base64');
    const mimeType = response.headers['content-type'] || 'image/jpeg';

    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: base64Image
            }
          },
          {
            type: 'text',
            text: `Analyze this food image and provide the following information in JSON format:
{
  "foodType": "name of the food dish",
  "quantity": "estimated quantity (e.g., '30 portions', '2 kg', '10 plates')",
  "dietaryTags": ["veg" or "non-veg" or "vegan", and any of: "gluten-free", "dairy-free"],
  "confidence": 0.0 to 1.0,
  "suggestedExpiryHours": number of hours until food should be consumed (typically 2-6 hours for cooked food)
}

Be specific about the food type. For Indian food, use common names like "Paneer Biryani", "Dal Makhani", "Chicken Curry", etc.
Estimate portions based on visible quantity. If you see multiple containers or large quantities, estimate accordingly.
Only respond with valid JSON, no additional text.`
          }
        ]
      }]
    });

    // Parse the response
    const content = message.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Calculate suggested expiry time
    const suggestedExpiry = new Date();
    suggestedExpiry.setHours(suggestedExpiry.getHours() + (analysis.suggestedExpiryHours || 4));

    return {
      foodType: analysis.foodType,
      quantity: analysis.quantity,
      dietaryTags: analysis.dietaryTags,
      confidence: analysis.confidence,
      suggestedExpiry: suggestedExpiry
    };
  } catch (error) {
    console.error('Food analysis error:', error);
    
    // Return fallback analysis
    return {
      foodType: 'Food item',
      quantity: 'Please specify',
      dietaryTags: [],
      confidence: 0,
      suggestedExpiry: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours from now
    };
  }
};

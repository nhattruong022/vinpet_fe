import axiosInstance from './axiosInstance';
import {
  ContentStructure,
  UploadImageParams,
  UploadedImage,
  Locale,
  ApiResponse
} from '../types/postImage';

export class PostImageService {
  private baseURL = '';

  /**
   * Lấy thông tin content structure của post
   * @param postId - ID của post
   * @param locale - Ngôn ngữ (vi, en, ko)
   * @returns Content structure với totalParagraphs và availablePositions
   */
  async getContentStructure(postId: string, locale: Locale = 'vi'): Promise<ContentStructure> {
    const response = await axiosInstance.get<ApiResponse<ContentStructure>>(
      `/admin/post/${postId}/content-structure?locale=${locale}`
    );
    const result = response.data.result || response.data.data;
    if (!result) {
      throw new Error('Invalid response: data is missing');
    }
    return result;
  }

  /**
   * Upload ảnh và chèn vào content
   * @param params - Thông tin upload (file, postId, position, altText)
   * @returns Thông tin ảnh đã upload
   */
  async uploadImage(params: UploadImageParams): Promise<UploadedImage> {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('postId', params.postId);
    formData.append('position', params.position.toString());

    if (params.altText) {
      formData.append('altText', params.altText);
    }

    const response = await axiosInstance.post<ApiResponse<UploadedImage>>(
      '/media/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const result = response.data.result || response.data.data;
    if (!result) {
      throw new Error('Invalid response: data is missing');
    }

    return result;
  }

  /**
   * Lấy post với images đã chèn vào content
   * @param postId - ID của post
   * @param locale - Ngôn ngữ (vi, en, ko)
   * @returns Post object với content đã có images
   */
  async getPostWithImages(postId: string, locale: Locale = 'vi') {
    const response = await axiosInstance.get<ApiResponse<any>>(
      `/posts/${postId}?locale=${locale}`
    );
    const result = response.data.result || response.data.data;
    if (!result) {
      throw new Error('Invalid response: data is missing');
    }
    return result;
  }
}

// Export singleton instance
export const postImageService = new PostImageService();



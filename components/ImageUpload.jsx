'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export default function ImageUpload({ onImageUpload, existingImage }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(existingImage || null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB.')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
    }
    reader.readAsDataURL(file)

    await uploadImage(file)
  }

  const uploadImage = async (file) => {
    setUploading(true)
    setUploadProgress(0)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${fileName}`

      const { data, error } = await supabase.storage
        .from('event-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        throw error
      }

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath)

      console.log('✅ Image uploaded:', publicUrl)
      setUploadProgress(100)

      onImageUpload(publicUrl)

      alert('✅ Image uploaded successfully!')

    } catch (error) {
      console.error('❌ Upload error:', error)
      alert(`Failed to upload image: ${error.message}`)
      setPreview(existingImage || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (preview && preview.includes('supabase.co')) {
      const urlParts = preview.split('/')
      const fileName = urlParts[urlParts.length - 1]
      
      const { error } = await supabase.storage
        .from('event-images')
        .remove([fileName])

      if (error) {
        console.error('Error removing image:', error)
      }
    }

    setPreview(null)
    onImageUpload(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: 'var(--text-color)' }}>
        Event Image
      </label>

      {preview ? (
        <div style={{ 
          position: 'relative',
          display: 'inline-block',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--border-color)'
        }}>
          <img 
            src={preview} 
            alt="Event preview" 
            style={{ 
              width: '200px', 
              height: '150px', 
              objectFit: 'cover',
              display: 'block'
            }}
          />
          <button
            onClick={handleRemove}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}
          >
            ×
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: '12px',
            padding: '30px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.3s',
            backgroundColor: 'var(--bg-color)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          <i className="fas fa-cloud-upload-alt" style={{ fontSize: '2rem', color: 'var(--gray-text)' }}></i>
          <p style={{ marginTop: '8px', color: 'var(--gray-text)' }}>
            Click to upload event image
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--gray-text)' }}>
            JPG, PNG, WebP • Max 5MB
          </p>
        </div>
      )}

      {uploading && (
        <div style={{ marginTop: '8px' }}>
          <div style={{
            height: '4px',
            backgroundColor: 'var(--border-color)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${uploadProgress}%`,
              backgroundColor: 'var(--primary)',
              transition: 'width 0.3s'
            }}></div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-text)', marginTop: '4px' }}>
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  )
}
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PhotoUploader from '@/shared/components/PhotoUploader'

// Mock the photoService
jest.mock('@/infrastructure/storage/photoService', () => ({
  uploadPhoto: jest.fn().mockResolvedValue('/uploads/test-image.jpg'),
  addAnnonceImageMeta: jest.fn().mockResolvedValue(undefined),
  deleteAnnoncePhotoWithMeta: jest.fn().mockResolvedValue(undefined),
  setAnnonceMainPhoto: jest.fn().mockResolvedValue(undefined),
  setColocImageMainByUrl: jest.fn().mockResolvedValue(undefined),
  deleteColocPhotoWithMeta: jest.fn().mockResolvedValue(undefined),
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

describe('PhotoUploader', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<PhotoUploader onChange={mockOnChange} />)
    expect(screen.getByText('Ajouter des photos')).toBeInTheDocument()
  })

  it('displays initial photos when provided', () => {
    const initialPhotos = [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg'
    ]
    
    render(
      <PhotoUploader 
        initial={initialPhotos} 
        onChange={mockOnChange} 
      />
    )
    
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
    expect(images[0]).toHaveAttribute('src', initialPhotos[0])
    expect(images[1]).toHaveAttribute('src', initialPhotos[1])
  })

  it('allows file upload', async () => {
    const user = userEvent.setup()
    render(<PhotoUploader onChange={mockOnChange} />)
    
    const fileInput = screen.getByLabelText('Ajouter des photos')
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    await user.upload(fileInput, file)
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  it('shows confirmation modal when deleting a photo', async () => {
    const user = userEvent.setup()
    const initialPhotos = ['https://example.com/photo1.jpg']
    
    render(
      <PhotoUploader 
        initial={initialPhotos} 
        onChange={mockOnChange} 
      />
    )
    
    const deleteButton = screen.getByTitle('Supprimer la photo')
    await user.click(deleteButton)
    
    expect(screen.getByText('Supprimer la photo ?')).toBeInTheDocument()
    expect(screen.getByText('Voulez-vous vraiment supprimer cette photo ? Cette action est irréversible.')).toBeInTheDocument()
  })

  it('sets main photo when clicking the main button', async () => {
    const user = userEvent.setup()
    const initialPhotos = [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg'
    ]
    
    render(
      <PhotoUploader 
        initial={initialPhotos} 
        onChange={mockOnChange}
        resourceType="annonce"
        resourceId="test-annonce-id"
      />
    )
    
    const mainButtons = screen.getAllByTitle('Définir comme principale')
    await user.click(mainButtons[1]) // Click on second photo
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  it('handles drag and drop reordering', async () => {
    const user = userEvent.setup()
    const initialPhotos = [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg'
    ]
    
    render(
      <PhotoUploader 
        initial={initialPhotos} 
        onChange={mockOnChange} 
      />
    )
    
    const photoElements = screen.getAllByRole('img')
    const firstPhoto = photoElements[0].closest('[draggable="true"]')
    const secondPhoto = photoElements[1].closest('[draggable="true"]')
    
    if (firstPhoto && secondPhoto) {
      fireEvent.dragStart(firstPhoto)
      fireEvent.dragOver(secondPhoto)
      fireEvent.drop(secondPhoto)
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled()
      })
    }
  })
})

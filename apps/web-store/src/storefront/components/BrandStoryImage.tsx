import { useEffect, useState } from 'react'

interface BrandStoryImageProps {
  alt: string
  fileName: string
  size: string
  src: string
}

/**
 * 图片未放入 public 目录时显示语义化占位，避免页面出现破图。
 */
export function BrandStoryImage({ alt, fileName, size, src }: BrandStoryImageProps) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setHasError(false)
  }, [src])

  if (!hasError) {
    return <img alt={alt} className="brand-story-image" onError={() => setHasError(true)} src={src} />
  }

  return (
    <div className="brand-story-image brand-story-image--placeholder" role="img" aria-label={`${alt} 图片占位`}>
      <span className="brand-story-image__label">图片待放置</span>
      <strong>{fileName}</strong>
      <span>{size}</span>
      <span>目录：`public/home/brands/`</span>
    </div>
  )
}

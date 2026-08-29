import { useEffect } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet.heat"

export default function HeatLayer({ locations }) {
  const map = useMap()

  useEffect(() => {
    console.log("HeatLayer locations:", locations)
    
    if (!locations?.length) {
      console.log("No heatmap locations")
      return
    }

    const maxCount = Math.max(...locations.map(location => location.count))

    const points = locations.map(location => [
      location.latitude,
      location.longitude,
      location.count / maxCount,
    ])

    console.log("Heat points:", points)
    console.log("L.heatLayer:", L.heatLayer)

    const layer = L.heatLayer(points, {
      radius: 25,
      blur: 20,
      maxZoom: 8,
      minOpacity: 0.3,
    })

    layer.addTo(map)

    return () => {
      map.removeLayer(layer)
    }
  }, [map, locations])

  return null
}
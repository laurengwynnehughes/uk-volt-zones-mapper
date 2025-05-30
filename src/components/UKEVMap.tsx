import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface BatteryAsset {
  id: string;
  name: string;
  region: string;
  voltage: number;
  capacity: number; // MW
  lat: number;
  lng: number;
  status: 'operational' | 'planned' | 'construction';
  zonePrice: number; // £/MWh
}

interface Zone {
  id: string;
  name: string;
  color: string;
  price: number;
  bounds: { lat: number; lng: number }[];
}

const UKEVMap = () => {
  const [selectedAsset, setSelectedAsset] = useState<BatteryAsset | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // Mock data for UK EV battery assets
  const batteryAssets: BatteryAsset[] = [
    { id: '1', name: 'London Gateway Battery', region: 'South East', voltage: 400, capacity: 50, lat: 51.5074, lng: -0.1278, status: 'operational', zonePrice: 85.5 },
    { id: '2', name: 'Manchester Energy Storage', region: 'North West', voltage: 275, capacity: 75, lat: 53.4808, lng: -2.2426, status: 'operational', zonePrice: 72.3 },
    { id: '3', name: 'Birmingham Battery Hub', region: 'West Midlands', voltage: 400, capacity: 60, lat: 52.4862, lng: -1.8904, status: 'construction', zonePrice: 78.9 },
    { id: '4', name: 'Edinburgh Power Bank', region: 'Scotland', voltage: 275, capacity: 40, lat: 55.9533, lng: -3.1883, status: 'operational', zonePrice: 65.2 },
    { id: '5', name: 'Cardiff Energy Reserve', region: 'Wales', voltage: 132, capacity: 30, lat: 51.4816, lng: -3.1791, status: 'planned', zonePrice: 70.1 },
    { id: '6', name: 'Newcastle Battery Farm', region: 'North East', voltage: 275, capacity: 45, lat: 54.9783, lng: -1.6178, status: 'operational', zonePrice: 68.7 },
    { id: '7', name: 'Bristol Storage Facility', region: 'South West', voltage: 132, capacity: 35, lat: 51.4545, lng: -2.5879, status: 'construction', zonePrice: 74.2 },
    { id: '8', name: 'Leeds Power Storage', region: 'Yorkshire', voltage: 400, capacity: 55, lat: 53.8008, lng: -1.5491, status: 'operational', zonePrice: 71.5 },
    { id: '9', name: 'Norwich Battery Station', region: 'East of England', voltage: 132, capacity: 25, lat: 52.6309, lng: 1.2974, status: 'planned', zonePrice: 76.8 },
    { id: '10', name: 'Southampton Energy Hub', region: 'South East', voltage: 275, capacity: 42, lat: 50.9097, lng: -1.4044, status: 'operational', zonePrice: 85.5 }
  ];

  // UK pricing zones
  const pricingZones: Zone[] = [
    { id: 'se', name: 'South East', color: '#ef4444', price: 85.5, bounds: [] },
    { id: 'sw', name: 'South West', color: '#f97316', price: 74.2, bounds: [] },
    { id: 'nw', name: 'North West', color: '#eab308', price: 72.3, bounds: [] },
    { id: 'ne', name: 'North East', color: '#22c55e', price: 68.7, bounds: [] },
    { id: 'ym', name: 'Yorkshire', color: '#06b6d4', price: 71.5, bounds: [] },
    { id: 'wm', name: 'West Midlands', color: '#3b82f6', price: 78.9, bounds: [] },
    { id: 'ee', name: 'East of England', color: '#8b5cf6', price: 76.8, bounds: [] },
    { id: 'scotland', name: 'Scotland', color: '#10b981', price: 65.2, bounds: [] },
    { id: 'wales', name: 'Wales', color: '#f59e0b', price: 70.1, bounds: [] }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500';
      case 'construction': return 'bg-yellow-500';
      case 'planned': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getVoltageSize = (voltage: number) => {
    if (voltage >= 400) return 'w-6 h-6';
    if (voltage >= 275) return 'w-5 h-5';
    return 'w-4 h-4';
  };

  const totalCapacity = batteryAssets.reduce((sum, asset) => sum + asset.capacity, 0);
  const avgPrice = pricingZones.reduce((sum, zone) => sum + zone.price, 0) / pricingZones.length;

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize Mapbox map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-2.5, 54.5], // Center on UK
      zoom: 5.5,
      projection: 'mercator'
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add battery assets as markers
    batteryAssets.forEach((asset) => {
      if (!map.current) return;

      // Create custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = `cursor-pointer ${getVoltageSize(asset.voltage)} ${getStatusColor(asset.status)} rounded-full border-2 border-white shadow-lg hover:scale-110 transition-transform flex items-center justify-center`;
      markerElement.innerHTML = `<span class="text-white text-xs font-bold">${asset.voltage}kV</span>`;
      
      markerElement.addEventListener('click', () => {
        setSelectedAsset(asset);
      });

      // Add marker to map
      new mapboxgl.Marker(markerElement)
        .setLngLat([asset.lng, asset.lat])
        .addTo(map.current!);
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">UK EV Battery Assets Map</h1>
          <p className="text-xl text-gray-600">Voltage Capacity & Zonal Pricing Overview</p>
          <p className="text-sm text-gray-500">Source: FTI Consulting & Energy Systems Catapult</p>
        </div>

        {/* Mapbox Token Input */}
        {!mapboxToken && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Setup Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Please enter your Mapbox public token to display the interactive map. 
                Get your token at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">mapbox.com</a>
              </p>
              <input
                type="text"
                placeholder="Enter Mapbox public token..."
                className="w-full p-2 border rounded"
                onChange={(e) => setMapboxToken(e.target.value)}
              />
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{batteryAssets.length}</div>
              <div className="text-sm text-gray-600">Total Assets</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{totalCapacity}MW</div>
              <div className="text-sm text-gray-600">Total Capacity</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">£{avgPrice.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Avg Price/MWh</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{pricingZones.length}</div>
              <div className="text-sm text-gray-600">Pricing Zones</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-2">
            <Card className="h-96 lg:h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Interactive Asset Map
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <div 
                  ref={mapContainer} 
                  className="w-full h-full rounded-lg"
                  style={{ minHeight: '400px' }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Asset Details */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedAsset ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">{selectedAsset.name}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Region:</div>
                      <div className="font-medium">{selectedAsset.region}</div>
                      <div>Voltage:</div>
                      <div className="font-medium">{selectedAsset.voltage}kV</div>
                      <div>Capacity:</div>
                      <div className="font-medium">{selectedAsset.capacity}MW</div>
                      <div>Status:</div>
                      <Badge variant={selectedAsset.status === 'operational' ? 'default' : 'secondary'}>
                        {selectedAsset.status}
                      </Badge>
                      <div>Zone Price:</div>
                      <div className="font-medium">£{selectedAsset.zonePrice}/MWh</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Click on an asset to view details</p>
                )}
              </CardContent>
            </Card>

            {/* Pricing Zones */}
            <Card>
              <CardHeader>
                <CardTitle>Zonal Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pricingZones.map((zone) => (
                    <div 
                      key={zone.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer
                        ${selectedZone === zone.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                      onClick={() => setSelectedZone(zone.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: zone.color }}
                        />
                        <span className="text-sm">{zone.name}</span>
                      </div>
                      <span className="text-sm font-medium">£{zone.price}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle>Legend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Asset Status</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-xs">Operational</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-xs">Under Construction</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-xs">Planned</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Voltage Levels</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                        <span className="text-xs">400kV+</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
                        <span className="text-xs">275kV</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                        <span className="text-xs">132kV</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UKEVMap;

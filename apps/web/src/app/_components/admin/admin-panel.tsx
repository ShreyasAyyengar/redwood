import { Tabs, TabsContent, TabsList, TabsTrigger } from "@redwood/shad-ui/components/tabs";
import { AttributeEditor } from "./attributes/attribute-editor";
import CSVUpload from "./csv/csv-upload";
import { RoomGroupEditor } from "./groups/room-group-editor";
import Overview from "./overview/overview";

export default function AdminPanel() {
  // Tabs: Overview, CSV Upload, Room Attributes, Room Groups, Statistics
  return (
    <div className="w-full!">
      <Tabs defaultValue="overview" orientation="vertical">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          <TabsTrigger value="attributes">Room Attributes</TabsTrigger>
          <TabsTrigger value="groups">Room Groups</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Overview />
        </TabsContent>
        <TabsContent value="csv">
          <CSVUpload />
        </TabsContent>
        <TabsContent value="attributes">
          <AttributeEditor />
        </TabsContent>
        <TabsContent value="groups">
          <RoomGroupEditor />
        </TabsContent>
        {/*<TabsContent value="statistics">*/}
        {/*  <Statistics />*/}
        {/*</TabsContent>*/}
      </Tabs>
    </div>
  );
}

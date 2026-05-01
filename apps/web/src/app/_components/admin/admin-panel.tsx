import { Tabs, TabsContent, TabsList, TabsTrigger } from "@redwood/shad-ui/components/tabs";
import { AttributeEditor } from "./attributes/attribute-editor";
import CSVUpload from "./csv/csv-upload";
import { RoomGroupEditor } from "./groups/room-group-editor";
import Overview from "./overview/overview";
import UserEditor from "./users/user-editor";

export default function AdminPanel() {
  const storeLastTab = (tab: string) => localStorage.setItem("adminLastTab", tab);
  const lastTab = localStorage.getItem("adminLastTab") ?? "overview";
  return (
    <div className="flex justify-center">
      <Tabs defaultValue={lastTab} orientation="vertical" onValueChange={storeLastTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
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
        <TabsContent value="users">
          <UserEditor />
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
